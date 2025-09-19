import { z } from '@hono/zod-openapi';

export const CommonErrorResponseSchema = z.object({
  // ToDo: define error code list (oneOf)
  error: z.string().openapi({
    example: 'TEST_ERROR_CODE',
    description: 'Error code',
    default: '',
  }),
});

export const CreateAccountRequestSchema = z
  .object({
    // ToDo: 文字種制約/先頭,末尾制約の実装
    name: z.string().min(1).max(64).openapi({
      example: '@example_man@example.com',
      description:
        'Characters must be [A-Za-z0-9-.] The first and last characters must be [A-Za-z0-9-.]',
    }),
    email: z.string().email().openapi({ example: 'foo@example.com' }),
    passphrase: z.string().min(8).max(512).openapi({
      example: 'じゃすた・いぐざんぽぅ',
      description:
        'Passphrase must be a UTF-8 string excluding spaces, tabs, full-width spaces, newlines, and null characters.',
    }),
    captcha_token: z.string().openapi({
      description: 'Captcha token (e.g. reCAPTCHA, Cloudflare Trunstile)',
    }),
  })
  .openapi('CreateAccountRequest');

export const CreateAccountResponseSchema = z
  .object({
    id: z.string().openapi({
      example: '38477395',
      description: 'Account ID',
    }),
    name: z.string().openapi({
      example: '@example_man@example.com',
      description: 'account name',
    }),
    email: z.string().email().openapi({
      example: 'foo@example.com',
      description: 'account email address',
    }),
  })
  .openapi('CreateAccountResponse');

export const UpdateAccountRequestSchema = z
  .object({
    nickname: z.optional(z.string().min(1).max(256)).openapi({
      description: 'Nickname',
      examples: ['Johndoe<:typescript:3939849792873>', 'ジョン・ドゥ🚉'],
    }),
    email: z.optional(z.string().email()).openapi({
      description: 'Email address',
      example: 'john@example.com',
    }),
    passphrase: z.optional(z.string().min(8).max(512)).openapi({
      description: 'Passphrase',
      example: 'じゃすた・いぐざんぽぅ',
    }),
    bio: z
      .string()
      .min(0)
      .max(1024)
      .openapi({
        description: 'Biography',
        examples: [
          '',
          'いい感じの自己紹介🆓',
          'This is bio hello^~ <:javascript:358409384>',
        ],
      }),
  })
  .openapi('UpdateAccountRequest');

export const UpdateAccountResponseSchema = z
  .object({
    id: z.string().openapi({
      example: '38477395',
      description: 'Account ID',
    }),
    name: z.string().openapi({
      example: '@example_man@example.com',
      description: 'account name',
    }),
    nickname: z.string().openapi({
      example: 'John Doe',
      description: 'account nickname',
    }),
    bio: z
      .string()
      .min(0)
      .max(1024)
      .openapi({
        description: 'Biography',
        examples: [
          '',
          'いい感じの自己紹介🆓',
          'This is bio hello^~ <:javascript:358409384>',
        ],
      }),
    email: z.string().email().openapi({
      example: 'foo@example.com',
      description: 'account email address',
    }),
  })
  .openapi('UpdateAccountResponse');

export const ResendVerificationEmailRequestSchema = z
  .object({
    captcha_token: z.string().openapi({
      description: 'Captcha token (e.g. reCAPTCHA, Cloudflare Trunstile)',
    }),
  })
  .openapi('ResendVerificationEmailRequest');

export const VerifyEmailRequestSchema = z
  .object({
    token: z.string().openapi({
      description: 'Verification token',
      example: 'vq34rvyanho10q9hbc98ydbvaervna43r0varhj',
    }),
  })
  .openapi('VerifyEmailRequest');

export const LoginRequestSchema = z
  .object({
    email: z.string().email().max(512).openapi({
      description: 'email address',
      example: 'johndoe@example.com',
    }),
    passphrase: z.string().min(8).max(512).openapi({
      description: 'Passphrase',
      example: 'じゃすた・いぐざんぽぅ',
    }),
    captcha_token: z.string().openapi({
      description: 'Captcha token (e.g. reCAPTCHA, Cloudflare Trunstile)',
    }),
  })
  .openapi('LoginRequest');

export const LoginResponseSchema = z
  .object({
    authorization_token: z.string().openapi({
      description: 'authorization token',
      example:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZTE2NDQ4MzMwMDAwMDIiLCJpYXQiOjE2NDA5OTUyMDEsInJlZnJlc2hfdG9rZW4iOiJleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKemRXSWlPaUl6WlRFMk5EUTRNek13TURBd01ESWlMQ0pwWVhRaU9qRTJOREE1T1RVeU1ERjkud2Q4cWJVcWowWGtCU1hud0FxM0lRYU1nQS1RTFd2MHVKU1NLX3BIVTZCYyJ9.mRUfLIYOGlLuC9D72zBriVvrHYrQgVHW7ntQ-bp5SHs',
    }),
  })
  .openapi('LoginResponse');

export const RefreshResponseSchema = z
  .object({
    authorization_token: z.string().openapi({
      description: 'authorization token',
      example:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZTE2NDQ4MzMwMDAwMDIiLCJpYXQiOjE2NDA5OTUyMDEsInJlZnJlc2hfdG9rZW4iOiJleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKemRXSWlPaUl6WlRFMk5EUTRNek13TURBd01ESWlMQ0pwWVhRaU9qRTJOREE1T1RVeU1ERjkud2Q4cWJVcWowWGtCU1hud0FxM0lRYU1nQS1RTFd2MHVKU1NLX3BIVTZCYyJ9.mRUfLIYOGlLuC9D72zBriVvrHYrQgVHW7ntQ-bp5SHs',
    }),
  })
  .openapi('RefreshResponse');

export const GetAccountResponseSchema = z
  .object({
    id: z.string().openapi({
      description: 'account ID',
      example: '38477395',
    }),
    email: z.string().optional().openapi({
      description:
        'account email address (only when logged in to an account with viewing privileges)',
      example: 'johndoe@example.com',
    }),
    name: z.string().min(8).max(512).openapi({
      description: 'account name',
      example: '@johndoe@example.com',
    }),
    nickname: z.string().min(1).max(256).openapi({
      description: 'account nickname',
      example: 'JohnDoe<:typescript:299384730049>',
    }),
    bio: z
      .string()
      .min(0)
      .max(1024)
      .openapi({
        description: 'Biography',
        examples: [
          '',
          'いい感じの自己紹介🆓',
          'This is bio hello^~ <:javascript:358409384>',
        ],
      }),
    avatar: z.string().url().openapi({
      description: 'avatar URL',
      example: 'https://example.com/avatar.png',
    }),
    header: z.string().url().openapi({
      description: 'header URL',
      example: 'https://example.com/header.png',
    }),
    followed_count: z.number().openapi({
      description: 'followed count',
      example: 100,
    }),
    following_count: z.number().openapi({
      description: 'following count',
      example: 100,
    }),
    note_count: z.number().openapi({
      description: 'note count',
      example: 100,
    }),
    role: z.string().optional().openapi({
      description:
        'account role (only when logged in to an account with viewing privileges)',
      example: 'normal',
    }),
    status: z.string().optional().openapi({
      description:
        'account status (only when logged in to an account with viewing privileges)',
      example: 'active',
    }),
    frozen: z.string().optional().openapi({
      description:
        'account frozen status (only when logged in to an account with viewing privileges)',
      example: 'normal',
    }),
    silenced: z.string().optional().openapi({
      description:
        'account silenced status (only when logged in to an account with viewing privileges)',
      example: 'normal',
    }),
    created_at: z.date().optional().openapi({
      description:
        'account created at (only when logged in to an account with viewing privileges)',
      example: '2021-01-01T00:00:00Z',
    }),
  })
  .openapi('GetAccountResponse');
export const GetAccountFollowingSchema = z
  .array(GetAccountResponseSchema)
  .openapi('GetAccountFollowingResponse');
export const GetAccountFollowerSchema = z
  .array(GetAccountResponseSchema)
  .openapi('GetAccountFollowerResponse');

// this is base schema. don't use directly / export this variable.
const SetAccountImageRequestBaseSchema = z.object({
  medium_id: z.string().openapi({
    description: 'Medium ID',
    example: '38477395',
  }),
});

export const SetAccountAvatarRequestSchema = SetAccountImageRequestBaseSchema;
export const SetAccountHeaderRequestSchema = SetAccountImageRequestBaseSchema;

export const GetAccountRelationshipsResponseSchema = z
  .object({
    id: z.string().openapi({
      description: 'Account ID',
      example: '31415926535',
    }),
    is_followed: z.boolean().openapi({
      description: 'Whether the account is followed by the target account',
      example: false,
    }),
    is_following: z.boolean().openapi({
      description: 'Whether the account is following the target account',
      example: true,
    }),
    is_follow_requesting: z.boolean().openapi({
      description:
        'Whether a follow request has been sent to the target account',
      example: false,
    }),
  })
  .openapi('GetAccountRelationshipsResponse');
