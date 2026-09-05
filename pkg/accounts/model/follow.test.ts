import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from './account.ts';
import { AccountFollow } from './follow.ts';

const exampleInput = {
  fromID: '1' as AccountID,
  targetID: '2' as AccountID,
  createdAt: new Date('2023-09-10T00:00:00.000Z'),
};

describe('AccountFollow', () => {
  it('generate new instance', () => {
    const follow = Result.unwrap(AccountFollow.new(exampleInput));

    expect(follow.getFromID()).toBe(exampleInput.fromID);
    expect(follow.getTargetID()).toBe(exampleInput.targetID);
    expect(follow.getCreatedAt()).toBe(exampleInput.createdAt);
    expect(follow.getDeletedAt()).toStrictEqual(Option.none());
  });
});

describe('AccountFollow domain events', () => {
  it('new() generates account.follow.requested and account.follow.accepted events', () => {
    const follow = Result.unwrap(AccountFollow.new(exampleInput));
    const events = follow.pullEvents();

    expect(events).toHaveLength(2);
    const [requested, accepted] = events;
    expect(requested?.eventName).toBe('account.follow.requested');
    expect(accepted?.eventName).toBe('account.follow.accepted');

    for (const event of events) {
      expect(event.target).toBe(exampleInput.targetID);
      expect(event.actor).toBe(exampleInput.fromID);
      expect(event.payload).toStrictEqual({ targetID: exampleInput.targetID });
    }
    expect(requested?.id).not.toBe(accepted?.id);
  });

  it('pullEvents() is destructive', () => {
    const follow = Result.unwrap(AccountFollow.new(exampleInput));
    expect(follow.pullEvents()).toHaveLength(2);
    expect(follow.pullEvents()).toStrictEqual([]);
  });

  it('setDeletedAt() generates an account.follow.unfollowed event', () => {
    const follow = Result.unwrap(AccountFollow.new(exampleInput));
    follow.pullEvents();

    const deletedAt = new Date('2023-09-11T00:00:00.000Z');
    const result = follow.setDeletedAt(deletedAt);
    expect(Result.isOk(result)).toBe(true);

    const events = follow.pullEvents();
    expect(events).toHaveLength(1);
    const [event] = events;
    expect(event?.eventName).toBe('account.follow.unfollowed');
    expect(event?.target).toBe(exampleInput.targetID);
    expect(event?.actor).toBe(exampleInput.fromID);
    expect(event?.payload).toStrictEqual({
      targetID: exampleInput.targetID,
    });
  });

  it('setDeletedAt() does not push an event when validation fails', () => {
    const follow = Result.unwrap(AccountFollow.new(exampleInput));
    follow.pullEvents();

    const result = follow.setDeletedAt(new Date('2023-09-09T00:00:00.000Z'));
    expect(Result.isErr(result)).toBe(true);
    expect(follow.pullEvents()).toStrictEqual([]);
  });
});
