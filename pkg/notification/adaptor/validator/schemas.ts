import { z } from '@hono/zod-openapi';

export const notificationActorSchema = z.object({
  type: z.union([z.literal('account'), z.literal('system')]),
  id: z.string(),
  name: z.string(),
  nickname: z.string(),
  avatar: z.string().url(),
});

export const notificationBaseSchema = z.object({
  id: z.string(),
  actor: notificationActorSchema,
  createdAt: z.string().datetime(),
});

export const followedNotificationSchema = notificationBaseSchema.extend({
  type: z.literal('followed'),
});

export const followAcceptedNotificationSchema = notificationBaseSchema.extend({
  type: z.literal('followAccepted'),
});

export const followRequestedNotificationSchema = notificationBaseSchema.extend({
  type: z.literal('followRequested'),
});

export const mentionedNotificationSchema = notificationBaseSchema.extend({
  type: z.literal('mentioned'),
  noteId: z.string(),
});

export const renotedNotificationSchema = notificationBaseSchema.extend({
  type: z.literal('renoted'),
  noteId: z.string(),
});

export const reactedNotificationSchema = notificationBaseSchema.extend({
  type: z.literal('reacted'),
  noteId: z.string(),
  content: z.string(),
});

export const GetNotificationsResponseSchema = z.array(
  z.union([
    followedNotificationSchema,
    followAcceptedNotificationSchema,
    followRequestedNotificationSchema,
    mentionedNotificationSchema,
    renotedNotificationSchema,
    reactedNotificationSchema,
  ]),
);
