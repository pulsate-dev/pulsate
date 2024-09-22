import { Option, Result } from '@mikuroxina/mini-fn';
import type { Prisma, PrismaClient } from '@prisma/client';

import type { AccountID } from '../../../accounts/model/account.js';
import type { prismaClient } from '../../../adaptors/prisma.js';
import { Medium, type MediumID } from '../../../drive/model/medium.js';
import { Bookmark } from '../../model/bookmark.js';
import { Note, type NoteID, type NoteVisibility } from '../../model/note.js';
import { Reaction } from '../../model/reaction.js';
import type {
  BookmarkRepository,
  NoteAttachmentRepository,
  NoteRepository,
  ReactionRepository,
} from '../../model/repository.js';

type DeserializeNoteArgs = Prisma.PromiseReturnType<
  typeof prismaClient.note.findUnique
>;

export class PrismaNoteRepository implements NoteRepository {
  constructor(private readonly client: PrismaClient) {}

  private serialize(note: Note): Prisma.NoteCreateInput {
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
      id: note.getID(),
      text: note.getContent(),
      visibility: visibility(),
      author: {
        connect: {
          id: note.getAuthorID(),
        },
      },
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
      id: data.id as NoteID,
      content: data.text,
      authorID: data.authorId as AccountID,
      createdAt: data.createdAt,
      deletedAt: !data.deletedAt ? Option.none() : Option.some(data.deletedAt),
      contentsWarningComment: '',
      originalNoteID: !data.renoteId
        ? Option.some(data.renoteId as NoteID)
        : Option.none(),
      attachmentFileID: [],
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

  async deleteByID(id: NoteID): Promise<Result.Result<Error, void>> {
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
    authorId: AccountID,
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
      // ToDo: logging here
      return Option.none();
    }
  }

  async findManyByIDs(ids: NoteID[]): Promise<Result.Result<Error, Note[]>> {
    try {
      const res = await this.client.note.findMany({
        where: {
          id: {
            in: [...new Set(ids)],
          },
          deletedAt: undefined,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return Result.ok(res.map((v) => this.deserialize(v)));
    } catch (e) {
      return Result.err(e as Error);
    }
  }

  async findByID(id: NoteID): Promise<Option.Option<Note>> {
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
    noteID: NoteID;
    accountID: AccountID;
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
    noteID: NoteID;
    accountID: AccountID;
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

  async findByAccountID(id: AccountID): Promise<Option.Option<Bookmark[]>> {
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
            noteID: v.noteId as NoteID,
            accountID: v.accountId as AccountID,
          }),
        ),
      );
    } catch {
      return Option.none();
    }
  }

  async findByID(id: {
    noteID: NoteID;
    accountID: AccountID;
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
          noteID: res.noteId as NoteID,
          accountID: res.accountId as AccountID,
        }),
      );
    } catch {
      return Option.none();
    }
  }
}

type DeserializeNoteAttachmentArgs = Prisma.PromiseReturnType<
  typeof prismaClient.noteAttachment.findMany<{ include: { medium: true } }>
>;

export class PrismaNoteAttachmentRepository
  implements NoteAttachmentRepository
{
  constructor(private readonly client: PrismaClient) {}

  private deserialize(data: DeserializeNoteAttachmentArgs): Medium[] {
    return data.map((v) => {
      const medium = v.medium;
      return Medium.reconstruct({
        authorId: medium.authorId as AccountID,
        hash: medium.hash,
        id: medium.id as MediumID,
        mime: medium.mime,
        name: medium.name,
        nsfw: medium.nsfw,
        thumbnailUrl: medium.thumbnailUrl,
        url: medium.url,
      });
    });
  }

  async create(
    noteID: NoteID,
    attachmentFileID: MediumID[],
  ): Promise<Result.Result<Error, void>> {
    const data = attachmentFileID.map((v) => {
      return {
        noteId: noteID,
        mediumId: v,
        alt: '',
      };
    });

    try {
      await this.client.noteAttachment.createMany({
        data,
      });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e as Error);
    }
  }

  async findByNoteID(noteID: NoteID): Promise<Result.Result<Error, Medium[]>> {
    try {
      const res = await this.client.noteAttachment.findMany({
        where: {
          noteId: noteID,
        },
        include: {
          medium: true,
        },
      });
      return Result.ok(this.deserialize(res));
    } catch (e) {
      return Result.err(e as Error);
    }
  }
}

type DeserializeReactionArgs = Prisma.PromiseReturnType<
  typeof prismaClient.reaction.findUnique
>;
export class PrismaReactionRepository implements ReactionRepository {
  constructor(private readonly client: PrismaClient) {}

  private deserialize(data: DeserializeReactionArgs): Reaction {
    if (!data) {
      throw new Error('Invalid Reaction data');
    }

    return Reaction.new({
      noteID: data.reactedToId as NoteID,
      accountID: data.reactedById as AccountID,
      body: data.body,
    });
  }

  async create(
    id: { noteID: NoteID; accountID: AccountID },
    body: string,
  ): Promise<Result.Result<Error, void>> {
    try {
      await this.client.reaction.create({
        data: {
          reactedToId: id.noteID,
          reactedById: id.accountID,
          body,
        },
      });

      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e as Error);
    }
  }

  async findByID(id: { noteID: NoteID; accountID: AccountID }): Promise<
    Option.Option<Reaction>
  > {
    try {
      const res = await this.client.reaction.findUnique({
        where: {
          reactedById_reactedToId: {
            reactedById: id.accountID,
            reactedToId: id.noteID,
          },
          deletedAt: undefined,
        },
      });

      return Option.some(this.deserialize(res));
    } catch (e) {
      console.log(e);
      return Option.none();
    }
  }

  async reactionsByAccount(
    id: AccountID,
  ): Promise<Result.Result<Error, Reaction[]>> {
    try {
      const res = await this.client.reaction.findMany({
        where: {
          reactedById: id,
          deletedAt: undefined,
        },
      });

      return Result.ok(res.map((v) => this.deserialize(v)));
    } catch (e) {
      return Result.err(e as Error);
    }
  }

  async findByNoteID(id: NoteID): Promise<Result.Result<Error, Reaction[]>> {
    try {
      const res = await this.client.reaction.findMany({
        where: {
          reactedToId: id,
          deletedAt: undefined,
        },
      });

      return Result.ok(res.map((v) => this.deserialize(v)));
    } catch (e) {
      return Result.err(e as Error);
    }
  }

  async deleteByID(id: { noteID: NoteID; accountID: AccountID }): Promise<
    Result.Result<Error, void>
  > {
    try {
      await this.client.reaction.update({
        where: {
          reactedById_reactedToId: {
            reactedById: id.accountID,
            reactedToId: id.noteID,
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
}
