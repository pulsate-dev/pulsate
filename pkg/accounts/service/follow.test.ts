import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { ID } from '../../id/type.js';
import { InMemoryAccountFollowRepository } from '../adaptor/repository/dummy.js';
import type { AccountID } from '../model/account.js';
import { FollowService } from './follow.js';

describe('FollowService', () => {
  const repository = new InMemoryAccountFollowRepository();
  const service = new FollowService(repository);

  it('should follow', async () => {
    const res = await service.handle(
      '1' as ID<AccountID>,
      '2' as ID<AccountID>,
    );

    expect(Result.isErr(res)).toBe(false);
    expect(Result.unwrap(res).getFromID).toBe('1' as ID<AccountID>);
    expect(Result.unwrap(res).getTargetID).toBe('2' as ID<AccountID>);
    expect(Result.unwrap(res).getDeletedAt).toBe(undefined);
  });
});
