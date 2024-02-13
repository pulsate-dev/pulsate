import { Option } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { ID } from '../../id/type.js';
import { InMemoryAccountFollowRepository } from '../adaptor/repository/dummy.js';
import type { AccountID } from '../model/account.js';
import { AccountFollow } from '../model/follow.js';
import { UnfollowService } from './unfollow.js';

describe('UnfollowService', () => {
  const repository = new InMemoryAccountFollowRepository([
    AccountFollow.new({
      fromID: '1' as ID<AccountID>,
      targetID: '2' as ID<AccountID>,
      createdAt: new Date(),
    }),
  ]);
  const service = new UnfollowService(repository);

  it('should unfollow', async () => {
    const res = await service.handle(
      '1' as ID<AccountID>,
      '2' as ID<AccountID>,
    );

    expect(Option.isSome(res)).toBe(false);
  });
});
