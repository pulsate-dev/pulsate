import { z } from '@hono/zod-openapi';
import {
  noteAttachmentSchema,
  reactionSchema,
} from '../../../notes/adaptor/validator/schema.js';

const TimelineNoteBaseSchema = z.object({
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
  reactions: z.array(reactionSchema).openapi({
    description: 'Reactions',
  }),
  attachment_files: z.array(noteAttachmentSchema).max(16).openapi({
    description: 'Note Attachment Media',
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
  renoted: z.boolean().openapi({
    example: false,
    description:
      'Whether the current user has renoted this note (always false if not logged in)',
    default: false,
  }),
});

export const GetAccountTimelineResponseSchema = z
  .array(TimelineNoteBaseSchema)
  .openapi('GetAccountTimelineResponse');

export const GetHomeTimelineResponseSchema = z.array(TimelineNoteBaseSchema);

export const GetPublicTimelineResponseSchema = z
  .array(TimelineNoteBaseSchema)
  .openapi('GetPublicTimelineResponse');

export const GetListTimelineResponseSchema = z
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
      reactions: z.array(reactionSchema).openapi({
        description: 'Reactions',
      }),
      attachment_files: z.array(noteAttachmentSchema).max(16).openapi({
        description: 'Note Attachment Media',
      }),
    }),
  )
  .openapi('GetListTimelineResponse');

export const CreateListRequestSchema = z
  .object({
    title: z.string().openapi({
      example: 'Pulsate developers',
      description: 'List title (1-100 characters)',
    }),
    public: z.coerce.boolean().default(false).openapi({
      type: 'boolean',
      example: false,
      description: 'If true, list is public',
    }),
  })
  .openapi('CreateListRequest');
export const CreateListResponseSchema = z
  .object({
    id: z.string().openapi({
      example: '38477395',
      description: 'List ID',
    }),
    title: z.string().openapi({
      example: 'Pulsate developers',
      description: 'List title',
    }),
    public: z.coerce.boolean().default(false).openapi({
      type: 'boolean',
      example: false,
      description: 'If true, list is public',
    }),
  })
  .openapi('CreateListResponse');

export const EditListRequestSchema = z
  .object({
    title: z
      .string()
      .openapi({
        example: 'Pulsate developers',
        description: 'List title',
      })
      .optional(),
    public: z
      .boolean()
      .openapi({
        type: 'boolean',
        example: false,
        description: 'If true, list is public',
      })
      .optional(),
  })
  .openapi('EditListRequest');
export const EditListResponseSchema = z
  .object({
    id: z.string().openapi({
      example: '38477395',
      description: 'List ID',
    }),
    title: z.string().openapi({
      example: 'Pulsate developers',
      description: 'List title',
    }),
    public: z.coerce.boolean().default(false).openapi({
      type: 'boolean',
      example: false,
      description: 'If true, list is public',
    }),
  })
  .openapi('EditListResponse');

export const FetchListResponseSchema = z
  .object({
    id: z.string().openapi({
      example: '38477395',
      description: 'List ID',
    }),
    title: z.string().openapi({
      example: 'Pulsate developers',
      description: 'List title',
    }),
    public: z.coerce.boolean().default(false).openapi({
      type: 'boolean',
      example: false,
      description: 'If true, list is public',
    }),
  })
  .openapi('FetchListResponse');

export const GetListMemberResponseSchema = z
  .object({
    assignees: z.array(
      z.object({
        id: z.string().openapi({
          example: '30984308495',
          description: 'Assignee account ID',
        }),
        name: z.string().openapi({
          example: '@john@example.com',
          description: 'Assignee account name',
        }),
        nickname: z.string().openapi({
          example: 'John Doe',
          description: 'Assignee nickname',
        }),
        avatar: z.string().url().openapi({
          example: 'https://example.com/avatar.png',
          description: 'avatar URL',
        }),
      }),
    ),
  })
  .openapi('GetListMemberResponseSchema');

export const GetConversationsResponseSchema = z
  .array(
    z.object({
      account: z.object({
        id: z.string().openapi({
          example: '30984308495',
          description: 'Assignee account ID',
        }),
        name: z.string().openapi({
          example: '@john@example.com',
          description: 'Assignee account name',
        }),
        nickname: z.string().openapi({
          example: 'John Doe',
          description: 'Assignee nickname',
        }),
        avatar: z.string().url().openapi({
          example: 'https://example.com/avatar.png',
          description: 'avatar URL',
        }),
      }),
      updatedAt: z.string().datetime().openapi({
        example: '2023-09-10T00:00:00.000Z',
        description: 'Last message sent',
      }),
    }),
  )
  .openapi('GetListConversationsResponse');
