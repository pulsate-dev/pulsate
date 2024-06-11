import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import { SnowflakeIDGenerator } from '../../id/mod.js';
import { InMemoryNoteRepository } from '../adaptor/repository/dummy.js';
import { CreateService } from './create.js';

const noteRepository = new InMemoryNoteRepository();
const createService = new CreateService(
  noteRepository,
  new SnowflakeIDGenerator(0, {
    now: () => BigInt(Date.UTC(2023, 9, 10, 0, 0)),
  }),
);

describe('CreateService', () => {
  it('should create a note', async () => {
    const res = await createService.handle(
      'Hello world',
      '',
      Option.none(),
      '1' as AccountID,
      'PUBLIC',
    );

    expect(Result.isOk(res)).toBe(true);
  });

  it('note content must be less than 3000 chars', async () => {
    const res = await createService.handle(
      'a'.repeat(3001),
      '',
      Option.none(),
      '1' as AccountID,
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
      'DIRECT',
    );

    expect(Result.isErr(res)).toBe(true);
  });
});
