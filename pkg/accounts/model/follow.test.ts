import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from './account.js';
import { AccountFollow, type CreateAccountFollowArgs } from './follow.js';

describe('AccountFollow', () => {
  it('generate new instance', () => {
    const exampleInput: CreateAccountFollowArgs = {
      fromID: '1' as AccountID,
      targetID: '2' as AccountID,
      createdAt: new Date('2023-09-10T00:00:00.000Z'),
      deletedAt: new Date('2023-09-10T10:00:00.000Z'),
    };

    const follow = AccountFollow.new(exampleInput);

    expect(follow.getFromID()).toBe(exampleInput.fromID);
    expect(follow.getTargetID()).toBe(exampleInput.targetID);
    expect(follow.getCreatedAt()).toBe(exampleInput.createdAt);
    expect(follow.getDeletedAt()).toStrictEqual(Option.none());
  });

  it('reconstruct restores all fields from DB data', () => {
    const follow = AccountFollow.reconstruct({
      fromID: '1' as AccountID,
      targetID: '2' as AccountID,
      createdAt: new Date('2023-09-10T00:00:00.000Z'),
      deletedAt: new Date('2023-09-10T10:00:00.000Z'),
    });

    expect(follow.getFromID()).toBe('1');
    expect(follow.getTargetID()).toBe('2');
    expect(follow.getDeletedAt()).toStrictEqual(
      Option.some(new Date('2023-09-10T10:00:00.000Z')),
    );
  });

  describe('setDeletedAt', () => {
    it.each([
      {
        title: 'valid deletedAt (after createdAt)',
        deletedAt: new Date('2023-09-10T10:00:00.000Z'),
        expected: true,
      },
      {
        title: 'invalid deletedAt (before createdAt)',
        deletedAt: new Date('2023-09-09T00:00:00.000Z'),
        expected: false,
      },
    ])('setDeletedAt: $title', ({ deletedAt, expected }) => {
      const follow = AccountFollow.new({
        fromID: '1' as AccountID,
        targetID: '2' as AccountID,
        createdAt: new Date('2023-09-10T00:00:00.000Z'),
      });
      const result = follow.setDeletedAt(deletedAt);
      expect(Result.isOk(result)).toBe(expected);
    });
  });
});
