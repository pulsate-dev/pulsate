import { z } from '@hono/zod-openapi';

export const NoteInternal = z.literal('INTERNAL_ERROR').openapi({
  description: 'Internal Error',
});
export const TooManyAttachments = z.literal('TOO_MANY_ATTACHMENTS').openapi({
  description: 'This note has too many attachments',
});
export const TooManyContent = z.literal('TOO_MANY_CONTENT').openapi({
  description: 'This note has too many (CW Comments or Note content)',
});
export const NoDestination = z.literal('NO_DESTINATION').openapi({
  description: 'This note has no destination',
});
export const InvalidVisibility = z.literal('INVALID_VISIBILITY').openapi({
  description: 'This note has an invalid visibility',
});
export const YouAreSilenced = z.literal('YOU_ARE_SILENCED').openapi({
  description: 'You are silenced (You cannot set visibility to public',
});
export const AttachmentNotFound = z.literal('ATTACHMENT_NOT_FOUND').openapi({
  description: 'Attachment not found',
});
export const NoteNotFound = z.literal('NOTE_NOT_FOUND').openapi({
  description: 'Note not found',
});
export const YouAreBlocked = z.literal('YOU_ARE_BLOCKED').openapi({
  description: 'You can not reply to this account note',
});
export const NoPermission = z.literal('NO_PERMISSION').openapi({
  description: 'You can not do this action',
});
export const AlreadyReacted = z.literal('ALREADY_REACTED').openapi({
  description: 'You already reacted to this note',
});
export const EmojiNotFound = z.literal('EMOJI_NOT_FOUND').openapi({
  description:
    'Emoji not found (Custom Emoji) / Specified many emojis (Unicode Emoji)',
});
export const NotReacted = z.literal('NOT_REACTED').openapi({
  description: 'You did not react to this note',
});
