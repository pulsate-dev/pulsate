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
