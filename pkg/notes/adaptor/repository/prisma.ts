import { Option, Result } from '@mikuroxina/mini-fn';
import { type Prisma, type PrismaClient } from '@prisma/client';

import type { AccountID } from '../../../accounts/model/account.js';
import type { prismaClient } from '../../../adaptors/prisma.js';
import type { ID } from '../../../id/type.js';
import { Bookmark } from '../../model/bookmark.js';
import { Note, type NoteID, type NoteVisibility } from '../../model/note.js';
import type {
  BookmarkRepository,
  NoteRepository,
} from '../../model/repository.js';

type DeserializeNoteArgs = Prisma.PromiseReturnType<
  typeof prismaClient.note.findUnique
>;

export class PrismaNoteRepository implements NoteRepository {
  constructor(private readonly client: PrismaClient) {}

  private serialize(note: Note) {
    const visibility = () => {
      switch (note.getVisibility()) {
        case 'PUBLIC':
          return 0;
        case 'HOME':
          return 1;
        case 'FOLLOWERS':
          return 2;
        case 'DIRECT':
          return 3;
      }
    };

    return {
      id: note.getID() as string,
      text: note.getContent(),
      visibility: visibility(),
      authorId: note.getAuthorID() as string,
      createdAt: note.getCreatedAt(),
      deletedAt: Option.isNone(note.getDeletedAt())
        ? undefined
        : Option.unwrap(note.getDeletedAt()),
    };
  }

  private deserialize(data: DeserializeNoteArgs): Note {
    if (!data) {
      throw new Error('Invalid Note data');
    }
    const visibility = (): NoteVisibility => {
      switch (data.visibility) {
        case 0:
          return 'PUBLIC';
        case 1:
          return 'HOME';
        case 2:
          return 'FOLLOWERS';
        case 3:
          return 'DIRECT';
        default:
          throw new Error('Invalid Visibility');
      }
    };
    return Note.reconstruct({
      id: data.id as ID<NoteID>,
      content: data.text,
      authorID: data.authorId as ID<AccountID>,
      createdAt: data.createdAt,
      deletedAt: !data.deletedAt ? Option.none() : Option.some(data.deletedAt),
      contentsWarningComment: '',
      originalNoteID: !data.renoteId
        ? Option.some(data.renoteId as ID<NoteID>)
        : Option.none(),
      // ToDo: add SendTo field to schema
      sendTo: Option.none(),
      updatedAt: Option.none(),
      visibility: visibility() as NoteVisibility,
    });
  }

  async create(note: Note): Promise<Result.Result<Error, void>> {
    const serialized = this.serialize(note);
    try {
      await this.client.note.create({
        data: serialized,
      });
    } catch (e) {
      return Result.err(e as Error);
    }
    return Result.ok(undefined);
  }

  async deleteByID(id: ID<NoteID>): Promise<Result.Result<Error, void>> {
    try {
      // NOTE: logical delete
      await this.client.note.update({
        where: {
          id,
        },
        data: {
          // ToDo: use Note.deletedAt
          deletedAt: new Date(),
        },
      });
    } catch (e) {
      return Result.err(e as Error);
    }
    return Result.ok(undefined);
  }

  async findByAuthorID(
    authorId: ID<AccountID>,
    limit: number,
  ): Promise<Option.Option<Note[]>> {
    try {
      const res = await this.client.note.findMany({
        where: {
          authorId,
          // NOTE: Exclude from the search those whose deletedAt does not appear undefined.
          deletedAt: undefined,
        },
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });
      return Option.some(res.map((v) => this.deserialize(v)));
    } catch {
      return Option.none();
    }
  }

  async findByID(id: ID<NoteID>): Promise<Option.Option<Note>> {
    try {
      const res = await this.client.note.findUniqueOrThrow({
        where: {
          id,
          // NOTE: Exclude from the search those whose deletedAt does not appear undefined.
          deletedAt: undefined,
        },
      });
      return Option.some(this.deserialize(res));
    } catch {
      return Option.none();
    }
  }
}

export class PrismaBookmarkRepository implements BookmarkRepository {
  constructor(private readonly client: PrismaClient) {}

  async create(id: {
    noteID: ID<NoteID>;
    accountID: ID<AccountID>;
  }): Promise<Result.Result<Error, void>> {
    try {
      await this.client.bookmark.create({
        data: {
          noteId: id.noteID,
          accountId: id.accountID,
        },
      });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e as Error);
    }
  }

  async deleteByID(id: {
    noteID: ID<NoteID>;
    accountID: ID<AccountID>;
  }): Promise<Result.Result<Error, void>> {
    try {
      await this.client.bookmark.update({
        where: {
          noteId_accountId: {
            accountId: id.accountID,
            noteId: id.noteID,
          },
        },
        data: {
          deletedAt: new Date(),
        },
      });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e as Error);
    }
  }

  async findByAccountID(id: ID<AccountID>): Promise<Option.Option<Bookmark[]>> {
    try {
      const res = await this.client.bookmark.findMany({
        where: {
          accountId: id,
          deletedAt: undefined,
        },
      });
      return Option.some(
        res.map((v) =>
          Bookmark.new({
            noteID: v.noteId as ID<NoteID>,
            accountID: v.accountId as ID<AccountID>,
          }),
        ),
      );
    } catch {
      return Option.none();
    }
  }

  async findByID(id: {
    noteID: ID<NoteID>;
    accountID: ID<AccountID>;
  }): Promise<Option.Option<Bookmark>> {
    try {
      const res = await this.client.bookmark.findUniqueOrThrow({
        where: {
          noteId_accountId: {
            accountId: id.accountID,
            noteId: id.noteID,
          },
          deletedAt: undefined,
        },
      });
      return Option.some(
        Bookmark.new({
          noteID: res.noteId as ID<NoteID>,
          accountID: res.accountId as ID<AccountID>,
        }),
      );
    } catch {
      return Option.none();
    }
  }
}
