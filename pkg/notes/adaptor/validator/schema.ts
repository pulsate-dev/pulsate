import { z } from '@hono/zod-openapi';

export const CommonErrorSchema = z.object({
  // ToDo: define error code list (oneOf)
  error: z.string().openapi({
    example: 'TEST_ERROR_CODE',
    description: 'Error code',
    default: '',
  }),
});

export const CreateNoteRequestSchema = z.object({
  content: z.string().max(3000).openapi({
    example: 'hello world!',
    description:
      'Note content (max 3000 characters/if attachment file exists, allow 0 character)',
    default: '',
  }),
  visibility: z.string().openapi({
    example: 'PUBLIC',
    description: 'Note visibility (PUBLIC/HOME/FOLLOWERS/DIRECT)',
    default: 'PUBLIC',
  }),
  // ToDo: Define attachment schema
  contents_warning_comment: z.string().max(256).openapi({
    example: 'This note contains sensitive content',
    description: 'Contents warning comment (max 256 characters)',
    default: '',
  }),
  send_to: z.string().optional().openapi({
    example: '38477395',
    description: 'Send to account ID (if visibility is DIRECT)',
    default: '',
  }),
});

export const CreateNoteResponseSchema = z.object({
  id: z.string().openapi({
    example: '38477395',
    description: 'Note ID',
  }),
  content: z.string().openapi({
    example: 'hello world!',
    description: 'Note content',
  }),
  visibility: z.string().openapi({
    example: 'PUBLIC',
    description: 'Note visibility',
  }),
  contents_warning_comment: z.string().openapi({
    example: 'This note contains sensitive content',
    description: 'Contents warning comment',
  }),
  send_to: z.string().optional().openapi({
    example: '38477395',
    description: 'Send to account ID',
  }),
  author_id: z.string().openapi({
    example: '38477395',
    description: 'Author account ID',
  }),
  created_at: z.string().openapi({
    example: '2021-01-01T00:00:00Z',
    description: 'Note created date',
  }),
});

export const GetNoteResponseSchema = z.object({
  id: z.string().openapi({
    example: '38477395',
    description: 'Note ID',
  }),
  content: z.string().openapi({
    example: 'hello world!',
    description: 'Note content',
  }),
  contents_warning_comment: z.string().openapi({
    example: '(if length not 0) This note contains sensitive content',
    description: 'Contents warning comment',
  }),
  send_to: z.string().optional().openapi({
    example: '38477395',
    description: 'Send to account ID',
  }),
  visibility: z.string().openapi({
    example: 'PUBLIC',
    description: 'Note visibility (PUBLIC/HOME/FOLLOWERS/DIRECT)',
  }),
  created_at: z.string().datetime().openapi({
    example: '2021-01-01T00:00:00Z',
    description: 'Note created date',
  }),
  author: z.object({
    id: z.string(),
    name: z.string(),
    display_name: z.string(),
    bio: z.string(),
    avatar: z.string(),
    header: z.string(),
    followed_count: z.number(),
    following_count: z.number(),
  }),
  // ToDo: add attachment_files, reactions
});

export const RenoteRequestSchema = z.object({
  content: z.string().max(3000).openapi({
    example: 'hello world!',
    description:
      'Note content (max 3000 characters/if attachment file exists, allow 0 character)',
    default: '',
  }),
  visibility: z
    .union([z.literal('public'), z.literal('home'), z.literal('followers')])
    .openapi({
      example: 'public',
      description: 'Note visibility (public/home/followers)',
      default: 'public',
    }),
  // ToDo: Define attachment schema
  contents_warning_comment: z.string().max(256).openapi({
    example: 'This note contains sensitive content',
    description: 'Contents warning comment (max 256 characters)',
    default: '',
  }),
});

export const RenoteResponseSchema = z.object({
  id: z.string().openapi({
    example: '38477395',
    description: 'Note ID',
  }),
  content: z.string().openapi({
    example: 'hello world!',
    description: 'Note content',
  }),
  visibility: z.string().openapi({
    example: 'PUBLIC',
    description: 'Note visibility',
  }),
  original_note_id: z.string().openapi({
    example: '38477395',
    description: 'Original note ID',
  }),
  contents_warning_comment: z.string().openapi({
    example: 'This note contains sensitive content',
    description: 'Contents warning comment',
  }),
  author_id: z.string().openapi({
    example: '38477395',
    description: 'Author account ID',
  }),
  created_at: z.string().openapi({
    example: '2021-01-01T00:00:00Z',
    description: 'Note created date',
  }),
});

export const CreateBookmarkRequestSchema = z.object({
  id: z.string().openapi({
    example: '38477395',
    description: 'Account ID',
  }),
});

export const DeleteBookmarkRequestSchema = z.object({
  id: z.string().openapi({
    example: '38477395',
    description: 'Account ID',
  }),
});

export const CreateBookmarkResponseSchema = z.object({
  id: z.string().openapi({
    example: '38477395',
    description: 'Note ID',
  }),
  content: z.string().openapi({
    example: 'hello world!',
    description: 'Note content',
  }),
  visibility: z.string().openapi({
    example: 'PUBLIC',
    description: 'Note visibility',
  }),
  contents_warning_comment: z.string().openapi({
    example: 'This note contains sensitive content',
    description: 'Contents warning comment',
  }),
  author_id: z.string().openapi({
    example: '38477395',
    description: 'Author account ID',
  }),
  created_at: z.string().openapi({
    example: '2021-01-01T00:00:00Z',
    description: 'Note created date',
  }),
});
