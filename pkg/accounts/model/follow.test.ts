import { describe, expect, it } from 'vitest';

import type { ID } from '../../id/type.js';
import type { AccountID } from './account.js';
import { AccountFollow, type CreateAccountFollowArgs } from './follow.js';

describe('AccountFollow', () => {
  it('generate new instance', () => {
    const exampleInput: CreateAccountFollowArgs = {
      fromID: '1' as ID<AccountID>,
      targetID: '2' as ID<AccountID>,
      createdAt: new Date('2023-09-10T00:00:00.000Z'),
      deletedAt: new Date('2023-09-10T10:00:00.000Z'),
    };

    const follow = AccountFollow.new(exampleInput);

    expect(follow.getFromID).toBe(exampleInput.fromID);
    expect(follow.getTargetID).toBe(exampleInput.targetID);
    expect(follow.getCreatedAt).toBe(exampleInput.createdAt);
    expect(follow.getDeletedAt).toBe(undefined);
  });
});
