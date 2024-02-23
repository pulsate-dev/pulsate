import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import { SnowflakeIDGenerator } from '../../id/mod.js';
import type { ID } from '../../id/type.js';
import { InMemoryNoteRepository } from '../adaptor/repository/dummy.js';
import { CreateNoteService } from './create.js';

const noteRepository = new InMemoryNoteRepository();
const createNoteService = new CreateNoteService(
  noteRepository,
  new SnowflakeIDGenerator(0, { now: () => BigInt(Date.now()) }),
);

describe('CreateNoteService', () => {
  it('should create a note', async () => {
    const res = await createNoteService.handle(
      'Hello world',
      '',
      Option.none(),
      '1' as ID<AccountID>,
      'PUBLIC',
    );

    expect(Result.isOk(res)).toBe(true);
    console.log(res[1]);
  });
});
