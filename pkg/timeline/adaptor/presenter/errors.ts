import { z } from '@hono/zod-openapi';

export const ListNotFound = z.literal('LIST_NOT_FOUND').openapi({
  description: 'List not found',
});

export const NothingLeft = z.literal('NOTHING_LEFT').openapi({
  description: 'No more notes exist',
});

export const TooManyMembers = z.literal('TOO_MANY_TARGETS').openapi({
  description: 'Too many members to assign list',
});

export const TooManyTargets = z.literal('TOO_MANY_TARGETS').openapi({
  description: 'Too many target accounts to remove from list',
});

export const TitleTooLong = z.literal('TITLE_TOO_LONG').openapi({
  description: 'List title is too long',
});

export const YouAreBlocked = z.literal('YOU_ARE_BLOCKED').openapi({
  description: 'You are blocked by the account',
});
export const TimelineInternalError = z.literal('INTERNAL_ERROR').openapi({
  description: 'Internal server error',
});
