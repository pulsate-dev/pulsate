import { Result } from '@mikuroxina/mini-fn';

import { serializeAccount } from '../../../accounts/adaptor/serializer/mod.js';
import type { Account } from '../../../accounts/model/account.js';
import type { Note } from '../../model/note.js';

export const serializeNote = (
  omits: string[],
  note: Note,
  author?: Account,
): Result.Result<Error, unknown> => {
  const base: Record<string, unknown> = {
    id: note.getID(),
    author_id: note.getAuthorID(),
    content: note.getContent(),
    visibility: note.getVisibility(),
    cwc: note.getCwComment(),
    send_to: note.getSendTo()[1],
    created_at: note.getCreatedAt(),
    updated_at: note.getUpdatedAt()[1],
    deleted_at: note.getDeletedAt()[1],
  };

  if (author !== undefined) {
    if (base.author_id !== author.getID()) {
      return Result.err(new Error('INVALID_ARGUMENT'));
    }

    delete base.author_id;
    const resAuthor = serializeAccount([], author);
    if (Result.isErr(resAuthor)) {
      return resAuthor;
    }

    base.author = resAuthor[1];
  }

  for (const key of omits) {
    delete base[key];
  }

  return Result.ok(base);
};
