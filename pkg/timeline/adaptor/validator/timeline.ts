import { z } from '@hono/zod-openapi';

export const GetAccountTimelineResponseSchema = z
  .array(
    z.object({
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
    }),
  )
  .openapi('GetAccountTimelineResponse');
