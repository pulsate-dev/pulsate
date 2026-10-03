import { OpenAPIHono } from '@hono/zod-openapi';
import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.ts';
import { AccountNotFoundError } from '../../accounts/model/errors.ts';
import {
  AuthenticateMiddlewareService,
  type AuthMiddlewareVariable,
} from '../../adaptors/authenticateMiddleware.ts';
import { noteModuleLogger } from '../adaptor/logger.ts';
import {
  bookmarkController,
  noteController,
  reactionController,
} from '../deps.ts';
import {
  NoteAccountSilencedError,
  NoteAlreadyReactedError,
  NoteAttachmentNotFoundError,
  NoteContentLengthError,
  NoteEmojiNotFoundError,
  NoteNotFoundError,
  NoteNotReactedYetError,
  NoteTooManyAttachmentsError,
  NoteVisibilityInvalidError,
} from '../model/errors.ts';
import {
  CreateBookmarkRoute,
  CreateNoteRoute,
  CreateReactionRoute,
  DeleteBookmarkRoute,
  DeleteReactionRoute,
  GetNoteRoute,
  RenoteRoute,
} from '../router.ts';

const AuthMiddleware = new AuthenticateMiddlewareService();

export const noteHandlers = new OpenAPIHono<{
  Variables: AuthMiddlewareVariable;
}>();

noteHandlers.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
});
noteHandlers.doc31('/notes/doc.json', {
  openapi: '3.1.0',
  info: {
    title: 'Notes API',
    version: '0.1.0',
  },
});

noteHandlers[CreateNoteRoute.method](
  CreateNoteRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
noteHandlers.openapi(CreateNoteRoute, async (c) => {
  const { content, visibility, contents_warning_comment, attachment_file_ids } =
    c.req.valid('json');
  const accountID = Option.unwrap(c.get('accountID'));

  const res = await noteController.createNote({
    authorID: accountID,
    content,
    visibility,
    contentsWarningComment: contents_warning_comment,
    attachmentFileID: attachment_file_ids,
  });
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    noteModuleLogger.warn(error);
    if (error instanceof NoteTooManyAttachmentsError) {
      return c.json({ error: 'TOO_MANY_ATTACHMENTS' as const }, 400);
    }
    if (error instanceof NoteContentLengthError) {
      return c.json({ error: 'TOO_MANY_CONTENT' as const }, 400);
    }
    if (error instanceof NoteVisibilityInvalidError) {
      return c.json({ error: 'INVALID_VISIBILITY' as const }, 400);
    }
    if (error instanceof NoteAccountSilencedError) {
      return c.json({ error: 'YOU_ARE_SILENCED' as const }, 403);
    }
    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    if (error instanceof NoteAttachmentNotFoundError) {
      return c.json({ error: 'ATTACHMENT_NOT_FOUND' as const }, 404);
    }

    noteModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(res[1], 200);
});

noteHandlers[GetNoteRoute.method](
  GetNoteRoute.path,
  AuthMiddleware.handle({ forceAuthorized: false }),
);
noteHandlers.openapi(GetNoteRoute, async (c) => {
  const { id } = c.req.param();
  const accountId = c.get('accountID') as Option.Option<AccountID>;
  const res = await noteController.getNoteByID(id, accountId);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    noteModuleLogger.warn(error);
    if (error instanceof NoteNotFoundError) {
      return c.json({ error: 'NOTE_NOT_FOUND' as const }, 404);
    }

    noteModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(res[1], 200);
});

noteHandlers[RenoteRoute.method](
  RenoteRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
noteHandlers.openapi(RenoteRoute, async (c) => {
  const { id } = c.req.param();
  const req = c.req.valid('json');
  const authorID = Option.unwrap(c.get('accountID'));

  const res = await noteController.renote({
    originalNoteID: id,
    content: req.content,
    contentsWarningComment: req.contents_warning_comment,
    authorID: authorID,
    visibility: req.visibility,
    attachmentFileID: req.attachment_file_ids,
  });

  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    noteModuleLogger.warn(error);

    if (error instanceof NoteTooManyAttachmentsError) {
      return c.json({ error: 'TOO_MANY_ATTACHMENTS' as const }, 400);
    }
    if (error instanceof NoteContentLengthError) {
      return c.json({ error: 'TOO_MANY_CONTENT' as const }, 400);
    }
    if (error instanceof NoteVisibilityInvalidError) {
      return c.json({ error: 'INVALID_VISIBILITY' as const }, 400);
    }
    if (error instanceof NoteAccountSilencedError) {
      return c.json({ error: 'YOU_ARE_SILENCED' as const }, 403);
    }
    if (error instanceof NoteNotFoundError) {
      return c.json({ error: 'NOTE_NOT_FOUND' as const }, 404);
    }

    noteModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(res[1], 200);
});

noteHandlers[CreateReactionRoute.method](
  CreateReactionRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
noteHandlers.openapi(CreateReactionRoute, async (c) => {
  const { id } = c.req.valid('param');
  const req = c.req.valid('json');
  const accountID = Option.unwrap(c.get('accountID'));

  const res = await reactionController.create(id, accountID, req.emoji);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    noteModuleLogger.warn(error);

    if (error instanceof NoteAlreadyReactedError) {
      return c.json({ error: 'ALREADY_REACTED' as const }, 400);
    }
    if (error instanceof NoteEmojiNotFoundError) {
      return c.json({ error: 'EMOJI_NOT_FOUND' as const }, 400);
    }
    if (error instanceof NoteNotFoundError) {
      return c.json({ error: 'NOTE_NOT_FOUND' as const }, 404);
    }

    noteModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(Result.unwrap(res), 200);
});

noteHandlers[DeleteReactionRoute.method](
  DeleteReactionRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
noteHandlers.openapi(DeleteReactionRoute, async (c) => {
  const { id } = c.req.valid('param');
  const accountID = Option.unwrap(c.get('accountID'));

  const res = await reactionController.delete(id, accountID);

  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    noteModuleLogger.warn(error);

    if (error instanceof NoteNotReactedYetError) {
      return c.json({ error: 'NOT_REACTED' as const }, 404);
    }

    noteModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return new Response(null, { status: 204 });
});

noteHandlers[CreateBookmarkRoute.method](
  CreateBookmarkRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
noteHandlers.openapi(CreateBookmarkRoute, async (c) => {
  const { id: noteID } = c.req.valid('param');
  const accountID = Option.unwrap(c.get('accountID'));

  const res = await bookmarkController.createBookmark(noteID, accountID);

  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    noteModuleLogger.warn(error);

    if (error instanceof NoteNotFoundError) {
      return c.json({ error: 'NOTE_NOT_FOUND' as const }, 404);
    }

    noteModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(res[1], 200);
});

noteHandlers[DeleteBookmarkRoute.method](
  DeleteBookmarkRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
noteHandlers.openapi(DeleteBookmarkRoute, async (c) => {
  const { id: noteID } = c.req.valid('param');
  const accountID = Option.unwrap(c.get('accountID'));

  const res = await bookmarkController.deleteBookmark(noteID, accountID);

  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    noteModuleLogger.warn(error);

    if (error instanceof NoteNotFoundError) {
      return c.json({ error: 'NOTE_NOT_FOUND' as const }, 404);
    }

    noteModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return new Response(null, { status: 204 });
});
