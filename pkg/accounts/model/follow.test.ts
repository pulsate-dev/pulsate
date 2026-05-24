import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from './account.js';
import { AccountFollow } from './follow.js';

describe('AccountFollow', () => {
  it('generate new instance', () => {
    const exampleInput = {
      fromID: '1' as AccountID,
      targetID: '2' as AccountID,
      createdAt: new Date('2023-09-10T00:00:00.000Z'),
    };

    const follow = Result.unwrap(AccountFollow.new(exampleInput));

    expect(follow.getFromID()).toBe(exampleInput.fromID);
    expect(follow.getTargetID()).toBe(exampleInput.targetID);
    expect(follow.getCreatedAt()).toBe(exampleInput.createdAt);
    expect(follow.getDeletedAt()).toStrictEqual(Option.none());
  });
});
