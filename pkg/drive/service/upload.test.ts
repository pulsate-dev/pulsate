import { readFile } from 'node:fs/promises';
import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.ts';
import { MockClock, SnowflakeIDGenerator } from '../../internal/id/mod.ts';
import { InMemoryMediaRepository } from '../adaptor/repository/dummy.ts';
import { LocalStorage } from '../adaptor/storage/dummy.ts';
import {
  MediaSizeTooLargeError,
  MediaTypeInvalidError,
} from '../model/errors.ts';
import { UploadMediaService } from './upload.ts';

describe('upload', () => {
  const clock = new MockClock(new Date());
  const idGenerator = new SnowflakeIDGenerator(0, clock);
  const repository = new InMemoryMediaRepository([]);
  const storageService = new LocalStorage();
  const service = new UploadMediaService(
    idGenerator,
    repository,
    storageService,
    1024 * 1024 * 10,
    clock,
  );

  it('valid files', async () => {
    const a = await readFile('./pkg/drive/testData/flower.jpeg');
    const res = await service.handle({
      name: 'flower.jpg',
      authorId: '1' as AccountID,
      nsfw: false,
      file: a,
    });
    const unwrapped = Result.unwrap(res);
    expect(unwrapped.getHash()).toStrictEqual(
      'U6IX{S^gnNNH0Kxv?bM{IU%MWBxu~WRiRk%L',
    );
    expect(unwrapped.getAuthorId()).toStrictEqual('1');
    expect(unwrapped.getName()).toStrictEqual('flower.jpg');
    expect(unwrapped.isNsfw()).toStrictEqual(false);
  });

  it('if file too large', async () => {
    const s = new UploadMediaService(
      idGenerator,
      repository,
      storageService,
      10,
      clock,
    );
    const a = await readFile('./pkg/drive/testData/flower.jpeg');
    const res = await s.handle({
      name: 'flower.jpg',
      authorId: '1' as AccountID,
      nsfw: false,
      file: a,
    });
    expect(Result.isErr(res)).toStrictEqual(true);
    expect(res[1]).toStrictEqual(
      new MediaSizeTooLargeError('File size is too large', { cause: null }),
    );
  });

  it('if unsupported file type', async () => {
    const a = await readFile('./pkg/drive/testData/tokyo.heic');
    const res = await service.handle({
      name: 'tokyo.heic',
      authorId: '1' as AccountID,
      nsfw: false,
      file: a,
    });
    expect(Result.isErr(res)).toStrictEqual(true);
    expect(res[1]).toStrictEqual(
      new MediaTypeInvalidError('Invalid file type', { cause: null }),
    );
  });
});
