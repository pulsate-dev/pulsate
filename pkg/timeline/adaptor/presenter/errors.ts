import { z } from '@hono/zod-openapi';

const ListNotFound = z.literal('LIST_NOT_FOUND').openapi({
  description: 'List not found',
});

const NothingLeft = z.literal('NOTHING_LEFT').openapi({
  description: 'No more notes exist',
});

const TooManyMembers = z.literal('TOO_MANY_TARGETS').openapi({
  description: 'Too many members to assign list',
});

const TooManyTargets = z.literal('TOO_MANY_TARGETS').openapi({
  description: 'Too many target accounts to remove from list',
});

const TitleTooLong = z.literal('TITLE_TOO_LONG').openapi({
  description: 'List title is too long',
});

const YouAreBlocked = z.literal('YOU_ARE_BLOCKED').openapi({
  description: 'You are blocked by the account',
});
