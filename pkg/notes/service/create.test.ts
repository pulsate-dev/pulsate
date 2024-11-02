import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import { Medium, type MediumID } from '../../drive/model/medium.js';
import { SnowflakeIDGenerator } from '../../id/mod.js';
import { dummyTimelineModuleFacade } from '../../intermodule/timeline.js';
import { InMemoryTimelineCacheRepository } from '../../timeline/adaptor/repository/dummyCache.js';
import {
  InMemoryNoteAttachmentRepository,
  InMemoryNoteRepository,
} from '../adaptor/repository/dummy.js';
import { CreateService } from './create.js';

const noteRepository = new InMemoryNoteRepository();
const attachmentRepository = new InMemoryNoteAttachmentRepository(
  Array.from({ length: 16 }, (_, i) => {
    return Medium.reconstruct({
      id: (i + 10).toString() as MediumID,
      name: (i + 10).toString(),
      mime: 'image/png',
      hash: 'ewkjnfgr]g:ge+ealksmc',
      url: '',
      thumbnailUrl: '',
      nsfw: false,
      authorId: '1' as AccountID,
    });
  }),
  [],
);

const timelineCacheRepository = new InMemoryTimelineCacheRepository([
  ['101' as AccountID, []],
  ['102' as AccountID, []],
  ['103' as AccountID, []],
]);
const createService = new CreateService(
  noteRepository,
  new SnowflakeIDGenerator(0, {
    now: () => BigInt(Date.UTC(2023, 9, 10, 0, 0)),
  }),
  attachmentRepository,
  dummyTimelineModuleFacade(timelineCacheRepository),
);

describe('CreateService', () => {
  it('should create a note', async () => {
    const res = await createService.handle(
      'Hello world',
      '',
      Option.none(),
      '1' as AccountID,
      [],
      'PUBLIC',
    );

    expect(Result.isOk(res)).toBe(true);
  });

  it('with attachments', async () => {
    const res = await createService.handle(
      'Hello world',
      '',
      Option.none(),
      '1' as AccountID,
      ['10' as MediumID, '11' as MediumID],
      'PUBLIC',
    );

    expect(Result.isOk(res)).toBe(true);
  });

  it('note attachment must be less than 16', async () => {
    const res = await createService.handle(
      'Hello world',
      '',
      Option.none(),
      '1' as AccountID,
      Array.from({ length: 17 }, (_, i) => i.toString() as MediumID),
      'PUBLIC',
    );

    expect(Result.isErr(res)).toBe(true);
  });

  it('note content must be less than 3000 chars', async () => {
    const res = await createService.handle(
      'a'.repeat(3001),
      '',
      Option.none(),
      '1' as AccountID,
      [],
      'PUBLIC',
    );

    expect(Result.isErr(res)).toBe(true);
  });

  it('note visibility DIRECT must have a destination', async () => {
    const res = await createService.handle(
      'Hello world',
      '',
      Option.none(),
      '1' as AccountID,
      [],
      'DIRECT',
    );

    expect(Result.isErr(res)).toBe(true);
  });

  it('should push note to timeline', async () => {
    await createService.handle(
      'Hello world',
      '',
      Option.none(),
      '101' as AccountID,
      [],
      'PUBLIC',
    );

    const res1 = await timelineCacheRepository.getHomeTimeline(
      '103' as AccountID,
    );
    expect(Result.isOk(res1)).toBe(true);
    expect(Result.unwrap(res1)).toHaveLength(1);
  });
});
