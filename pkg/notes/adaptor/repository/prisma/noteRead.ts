import { Option, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../../../accounts/model/account.ts';
import type {
  Prisma,
  PrismaClient,
} from '../../../../adaptors/prisma/client.ts';
import { Medium, type MediumID } from '../../../../drive/model/medium.ts';
import type { Principal } from '../../../../internal/policy/principal.ts';
import { NoteInternalError, NoteNotFoundError } from '../../../model/errors.ts';
import { Note, type NoteID, type NoteVisibility } from '../../../model/note.ts';
import { Reaction, type ReactionID } from '../../../model/reaction.ts';
import type { NoteReadRepository } from '../../../model/repository.ts';
import type { NoteReadScope } from '../../../policy/notePolicy.ts';

function visibility(
  value: number,
): Result.Result<NoteInternalError, NoteVisibility> {
  switch (value) {
    case 0:
      return Result.ok<NoteVisibility>('PUBLIC');
    case 1:
      return Result.ok<NoteVisibility>('HOME');
    case 2:
      return Result.ok<NoteVisibility>('FOLLOWERS');
    case 3:
      return Result.ok<NoteVisibility>('DIRECT');
    default:
      return Result.err(
        new NoteInternalError('Invalid note visibility', {
          cause: { visibility: value },
        }),
      );
  }
}

function failure(cause: unknown) {
  return Result.err(new NoteInternalError('Failed to read note', { cause }));
}

function notFound() {
  return Result.err(new NoteNotFoundError('Note not found', { cause: null }));
}

export class PrismaNoteReadRepository implements NoteReadRepository {
  readonly #client: PrismaClient;

  constructor(client: PrismaClient) {
    this.#client = client;
  }

  #snapshot<T>(
    read: (client: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    // Nested relation queries must see the same parent authorization state.
    return this.#client.$transaction(read, {
      isolationLevel: 'RepeatableRead',
    });
  }

  #where(scope: NoteReadScope): Prisma.NoteWhereInput {
    const principal = scope.principal;
    return {
      id: scope.noteId,
      deletedAt: null,
      author: { deletedAt: null, frozen: 0 },
      OR: [
        { visibility: { in: [0, 1] } },
        ...(principal.kind === 'account'
          ? [
              {
                visibility: 2,
                OR: [
                  { authorId: principal.accountId },
                  {
                    author: {
                      // This relation represents incoming follows despite its name.
                      following: {
                        some: {
                          fromId: principal.accountId,
                          deletedAt: null,
                        },
                      },
                    },
                  },
                ],
              },
            ]
          : []),
      ],
    };
  }

  async findAuthorization(
    noteId: NoteID,
    principal: Principal<AccountID>,
  ): ReturnType<NoteReadRepository['findAuthorization']> {
    try {
      const data = await this.#client.note.findUnique({
        where: { id: noteId },
        select: {
          id: true,
          authorId: true,
          visibility: true,
          deletedAt: true,
          author: { select: { frozen: true, deletedAt: true } },
        },
      });
      if (!data) return Result.ok(Option.none());
      const noteVisibility = visibility(data.visibility);
      if (Result.isErr(noteVisibility)) return noteVisibility;
      const follow =
        data.visibility === 2 &&
        data.deletedAt === null &&
        data.author.deletedAt === null &&
        data.author.frozen === 0 &&
        principal.kind === 'account' &&
        principal.accountId !== data.authorId
          ? await this.#client.following.findFirst({
              where: {
                fromId: principal.accountId,
                toId: data.authorId,
                deletedAt: null,
              },
              select: { fromId: true },
            })
          : null;
      return Result.ok(
        Option.some({
          resource: {
            noteId: data.id as NoteID,
            authorId: data.authorId as AccountID,
            visibility: Result.unwrap(noteVisibility),
            deleted: data.deletedAt !== null,
          },
          context: {
            authorAvailable:
              data.author.deletedAt === null && data.author.frozen === 0,
            following: follow !== null,
          },
        }),
      );
    } catch (error) {
      return failure(error);
    }
  }

  async findNote(
    scope: NoteReadScope,
  ): ReturnType<NoteReadRepository['findNote']> {
    try {
      const data = await this.#snapshot((client) =>
        client.note.findFirst({
          where: this.#where(scope),
          include: {
            author: {
              select: { id: true, name: true, nickname: true, bio: true },
            },
            noteAttachment: {
              where: { deletedAt: null, medium: { deletedAt: null } },
              select: { mediumId: true },
            },
          },
        }),
      );
      if (!data) return notFound();
      const noteVisibility = visibility(data.visibility);
      if (Result.isErr(noteVisibility)) return noteVisibility;
      return Result.ok({
        note: Note.reconstruct({
          id: data.id as NoteID,
          authorID: data.authorId as AccountID,
          content: data.text,
          visibility: Result.unwrap(noteVisibility),
          createdAt: data.createdAt,
          deletedAt: Option.none(),
          updatedAt: Option.none(),
          sendTo: Option.none(),
          contentsWarningComment: '',
          attachmentFileID: data.noteAttachment.map(
            (attachment) => attachment.mediumId as MediumID,
          ),
          originalNoteID: data.renoteId
            ? Option.some(data.renoteId as NoteID)
            : Option.none(),
        }),
        author: {
          id: data.author.id as AccountID,
          name: data.author.name,
          display_name: data.author.nickname,
          bio: data.author.bio,
        },
      });
    } catch (error) {
      return failure(error);
    }
  }

  async findAttachments(
    scope: NoteReadScope,
  ): ReturnType<NoteReadRepository['findAttachments']> {
    try {
      // Root the query at the visible parent to distinguish an empty list from denial.
      const data = await this.#snapshot((client) =>
        client.note.findFirst({
          where: this.#where(scope),
          select: {
            noteAttachment: {
              where: { deletedAt: null, medium: { deletedAt: null } },
              select: { medium: true },
            },
          },
        }),
      );
      if (!data) return notFound();
      return Result.ok(
        data.noteAttachment.map(({ medium }) =>
          Medium.reconstruct({
            id: medium.id as MediumID,
            authorId: medium.authorId as AccountID,
            name: medium.name,
            mime: medium.mime,
            hash: medium.hash,
            nsfw: medium.nsfw,
            url: medium.url ? Option.some(medium.url) : Option.none(),
            thumbnailUrl: medium.thumbnailUrl
              ? Option.some(medium.thumbnailUrl)
              : Option.none(),
          }),
        ),
      );
    } catch (error) {
      return failure(error);
    }
  }

  async findReactions(
    scope: NoteReadScope,
  ): ReturnType<NoteReadRepository['findReactions']> {
    try {
      const data = await this.#snapshot((client) =>
        client.note.findFirst({
          where: this.#where(scope),
          select: { reaction: { where: { deletedAt: null } } },
        }),
      );
      if (!data) return notFound();
      return Result.ok(
        data.reaction.map((reaction) =>
          Reaction.reconstruct({
            id: reaction.reactionId as ReactionID,
            noteID: reaction.reactedToId as NoteID,
            accountID: reaction.reactedById as AccountID,
            body: reaction.body,
          }),
        ),
      );
    } catch (error) {
      return failure(error);
    }
  }

  async findRenoteStatus(
    scope: NoteReadScope,
  ): ReturnType<NoteReadRepository['findRenoteStatus']> {
    if (scope.principal.kind === 'anonymous') return Result.ok(false);
    const accountId = scope.principal.accountId;
    try {
      const data = await this.#snapshot((client) =>
        client.note.findFirst({
          where: this.#where(scope),
          select: {
            renotes: {
              where: { authorId: accountId, deletedAt: null },
              select: { id: true },
              take: 1,
            },
          },
        }),
      );
      if (!data) return notFound();
      return Result.ok(data.renotes.length > 0);
    } catch (error) {
      return failure(error);
    }
  }
}
