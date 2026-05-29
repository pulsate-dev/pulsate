import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../../accounts/model/account.js';
import type { PrismaClient } from '../../../../adaptors/prisma/client.js';
import type { prismaClient } from '../../../../adaptors/prisma.js';
import { Medium, type MediumID } from '../../../../drive/model/medium.js';
import { DirectNote, type DirectNoteID } from '../../../model/directNote.js';
import {
  type DirectNoteAttachmentRepository,
  type DirectNoteRepository,
  directNoteAttachmentRepoSymbol,
  directNoteRepoSymbol,
} from '../../../model/repository.js';

type RawDirectNote = Awaited<
  ReturnType<typeof prismaClient.directNote.findUnique>
>;

type RawDirectNoteAttachment = Awaited<
  ReturnType<
    typeof prismaClient.directNoteAttachment.findMany<{
      include: { medium: true };
    }>
  >
>;

export class PrismaDirectNoteRepository implements DirectNoteRepository {
  constructor(private readonly client: PrismaClient) {}

  private deserialize(data: RawDirectNote): DirectNote {
    if (!data) {
      throw new Error('Invalid DirectNote data');
    }
    return DirectNote.reconstruct({
      id: data.id as DirectNoteID,
      authorID: data.authorId as AccountID,
      recipientID: data.recipientId as AccountID,
      content: data.text,
      // NOTE: contentsWarningComment is not stored in DB yet
      contentsWarningComment: '',
      attachmentFileID: [],
      createdAt: data.createdAt,
      deletedAt: data.deletedAt ? Option.some(data.deletedAt) : Option.none(),
    });
  }

  async create(note: DirectNote): Promise<Result.Result<Error, void>> {
    try {
      await this.client.directNote.create({
        data: {
          id: note.getID(),
          text: note.getContent(),
          authorId: note.getAuthorID(),
          recipientId: note.getRecipientID(),
          createdAt: note.getCreatedAt(),
          deletedAt: Option.isNone(note.getDeletedAt())
            ? undefined
            : Option.unwrap(note.getDeletedAt()),
        },
      });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e as Error);
    }
  }

  async findByID(
    id: DirectNoteID,
  ): Promise<Result.Result<Error, Option.Option<DirectNote>>> {
    try {
      const res = await this.client.directNote.findUnique({
        where: { id, deletedAt: null },
      });
      if (!res) return Result.ok(Option.none());
      return Result.ok(Option.some(this.deserialize(res)));
    } catch (e) {
      return Result.err(e as Error);
    }
  }

  async findByRecipientID(
    recipientID: AccountID,
  ): Promise<Result.Result<Error, DirectNote[]>> {
    try {
      const res = await this.client.directNote.findMany({
        where: { recipientId: recipientID, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      return Result.ok(res.map((v) => this.deserialize(v)));
    } catch (e) {
      return Result.err(e as Error);
    }
  }

  async deleteByID(id: DirectNoteID): Promise<Result.Result<Error, void>> {
    try {
      await this.client.directNote.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e as Error);
    }
  }
}

export const prismaDirectNoteRepo = (client: PrismaClient) =>
  Ether.newEther(
    directNoteRepoSymbol,
    () => new PrismaDirectNoteRepository(client),
  );

export class PrismaDirectNoteAttachmentRepository
  implements DirectNoteAttachmentRepository
{
  constructor(private readonly client: PrismaClient) {}

  private deserialize(data: RawDirectNoteAttachment): Medium[] {
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
    directNoteID: DirectNoteID,
    attachmentFileID: readonly MediumID[],
  ): Promise<Result.Result<Error, void>> {
    const data = [...attachmentFileID].map((v) => ({
      directNoteId: directNoteID,
      mediumId: v,
      alt: '',
    }));
    try {
      await this.client.directNoteAttachment.createMany({ data });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e as Error);
    }
  }

  async findByDirectNoteID(
    directNoteID: DirectNoteID,
  ): Promise<Result.Result<Error, Medium[]>> {
    try {
      const res = await this.client.directNoteAttachment.findMany({
        where: { directNoteId: directNoteID },
        include: { medium: true },
      });
      return Result.ok(this.deserialize(res));
    } catch (e) {
      return Result.err(e as Error);
    }
  }
}

export const prismaDirectNoteAttachmentRepo = (client: PrismaClient) =>
  Ether.newEther(
    directNoteAttachmentRepoSymbol,
    () => new PrismaDirectNoteAttachmentRepository(client),
  );
