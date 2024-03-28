import { z } from '@hono/zod-openapi';

// TODO: もっとどうにかならんのか
import { GetNoteResponseSchema } from '../../../notes/adaptor/validator/schema.js';

export const NoteSchema = GetNoteResponseSchema;

// TODO: 逃げてる
export const CommonErrorResponseSchema = z.object({
  error: z
    .enum([
      'INVALID_TIMELINE_TYPE',
      'YOU_ARE_BLOCKED',
      'NOTHING_LEFT',
      'ACCOUNT_NOT_FOUND',
    ])
    .or(z.string())
    .openapi({
      description: 'Error code',
    }),
});

export const GetTimelineResponseSchema = NoteSchema.array();
