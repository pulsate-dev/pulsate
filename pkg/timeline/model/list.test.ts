import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.ts';
import type { EventMeta } from '../../internal/event/type.ts';
import { MockClock, SnowflakeIDGenerator } from '../../internal/id/mod.ts';
import {
  ListMemberAlreadyExistsError,
  ListTitleLengthInvalidError,
  ListTooManyMembersError,
} from './errors.ts';
import { type CreateListArgs, List, type ListID } from './list.ts';

describe('List', () => {
  const args: CreateListArgs = {
    id: '1' as ListID,
    title: 'My List',
    publicity: 'PUBLIC',
    ownerId: '2' as AccountID,
    memberIds: ['3' as AccountID],
    createdAt: new Date(),
  } as const;

  const occurredAt = new Date('2023-09-10T00:00:00.000Z');
  const workingIDGenerator = new SnowflakeIDGenerator(
    0,
    new MockClock(occurredAt),
  );
  // NOTE: a clock stuck before OFFSET_FROM_UNIX_EPOCH makes generate() always fail.
  const failingIDGenerator = new SnowflakeIDGenerator(
    0,
    new MockClock(new Date(0)),
  );
  const meta: EventMeta<AccountID> = {
    idGenerator: workingIDGenerator,
    actor: args.ownerId,
    occurredAt,
  };

  describe('new', () => {
    it('should create a new list', () => {
      const res = List.new(args, meta);

      expect(Result.isOk(res)).toBe(true);
      const list = Result.unwrap(res);
      expect(list.getId()).toBe(args.id);
      expect(list.getTitle()).toBe(args.title);
      expect(list.isPublic()).toBe(true);
      expect(list.getOwnerId()).toBe(args.ownerId);
      expect(list.getMemberIds()).toEqual(args.memberIds);
      expect(list.getCreatedAt()).toBe(args.createdAt);
    });

    it('should return ListTitleLengthInvalidError when title is empty', () => {
      const res = List.new({ ...args, title: '' }, meta);

      expect(Result.isErr(res)).toBe(true);
      expect(Result.unwrapErr(res)).toBeInstanceOf(ListTitleLengthInvalidError);
    });

    it('should return ListTitleLengthInvalidError when title exceeds 100 chars', () => {
      const res = List.new({ ...args, title: 'a'.repeat(101) }, meta);

      expect(Result.isErr(res)).toBe(true);
      expect(Result.unwrapErr(res)).toBeInstanceOf(ListTitleLengthInvalidError);
    });

    it('should return ListTooManyMembersError when memberIds exceeds 250', () => {
      const memberIds = Array.from(
        { length: 251 },
        (_, i) => `${i + 1}` as AccountID,
      );
      const res = List.new({ ...args, memberIds }, meta);

      expect(Result.isErr(res)).toBe(true);
      expect(Result.unwrapErr(res)).toBeInstanceOf(ListTooManyMembersError);
    });

    it('should return Error when event ID generation fails', () => {
      const res = List.new(args, { ...meta, idGenerator: failingIDGenerator });

      expect(Result.isErr(res)).toBe(true);
    });
  });

  it('should add a member to the list', () => {
    const list = List.reconstruct(args);
    const memberId = '4' as AccountID;

    const res = list.addMember(memberId, meta);

    expect(Result.isOk(res)).toBe(true);
    expect(list.getMemberIds()).toStrictEqual([
      '3' as AccountID,
      '4' as AccountID,
    ]);
  });

  it('should not add a member if already in the list', () => {
    const list = List.reconstruct({
      ...args,
      memberIds: ['3' as AccountID],
    });
    const memberId = '3' as AccountID;

    const res = list.addMember(memberId, meta);

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(ListMemberAlreadyExistsError);
    expect(list.getMemberIds()).toStrictEqual(['3' as AccountID]);
  });

  it('should reject adding a member when member count reaches the limit (250)', () => {
    const memberIds = Array.from(
      { length: 250 },
      (_, i) => `${i + 1}` as AccountID,
    );
    const list = List.reconstruct({ ...args, memberIds });
    const newMemberId = '251' as AccountID;

    const res = list.addMember(newMemberId, meta);

    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(ListTooManyMembersError);
    expect(list.getMemberIds()).toHaveLength(250);
  });

  it('should remove member from list', () => {
    const list = List.reconstruct({
      ...args,
      memberIds: ['3' as AccountID],
    });
    const memberId = '3' as AccountID;

    const res = list.removeMember(memberId, meta);

    expect(Result.isOk(res)).toBe(true);
    expect(list.getMemberIds()).toStrictEqual([]);
  });

  it('should no duplicate member when initialize', () => {
    const list = List.reconstruct({
      ...args,
      memberIds: ['3' as AccountID, '3' as AccountID],
    });
    expect(list.getMemberIds()).toStrictEqual(['3' as AccountID]);
  });

  describe('setTitle', () => {
    it('should set title when length is within range', () => {
      const list = List.reconstruct(args);

      const res = list.setTitle('Edited Title');

      expect(Result.isOk(res)).toBe(true);
      expect(list.getTitle()).toBe('Edited Title');
    });

    it('should return ListTitleLengthInvalidError when title is empty', () => {
      const list = List.reconstruct(args);

      const res = list.setTitle('');

      expect(Result.isErr(res)).toBe(true);
      expect(Result.unwrapErr(res)).toBeInstanceOf(ListTitleLengthInvalidError);
      expect(list.getTitle()).toBe(args.title);
    });

    it('should return ListTitleLengthInvalidError when title exceeds 100 chars', () => {
      const list = List.reconstruct(args);
      const tooLong = 'a'.repeat(101);

      const res = list.setTitle(tooLong);

      expect(Result.isErr(res)).toBe(true);
      expect(Result.unwrapErr(res)).toBeInstanceOf(ListTitleLengthInvalidError);
      expect(list.getTitle()).toBe(args.title);
    });
  });

  describe('publicity', () => {
    it('should turn private via toPrivate', () => {
      const list = List.reconstruct(args);

      const res = list.toPrivate();

      expect(Result.isOk(res)).toBe(true);
      expect(list.isPublic()).toBe(false);
    });

    it('should turn public via toPublic', () => {
      const list = List.reconstruct({ ...args, publicity: 'PRIVATE' });

      const res = list.toPublic();

      expect(Result.isOk(res)).toBe(true);
      expect(list.isPublic()).toBe(true);
    });
  });

  describe('domain events', () => {
    it('should not push any event on reconstruct', () => {
      const list = List.reconstruct(args);

      expect(list.pullEvents()).toStrictEqual([]);
    });

    describe('list.created', () => {
      it('should push exactly one list.created event on success', () => {
        const res = List.new(args, meta);
        const list = Result.unwrap(res);

        const events = list.pullEvents();

        expect(events).toHaveLength(1);
        expect(events[0]).toStrictEqual({
          id: events[0]?.id,
          eventName: 'list.created',
          target: args.id,
          actor: args.ownerId,
          occurredAt,
          payload: { ownerID: args.ownerId, title: args.title },
        });
      });

      it('should not push any event when validation fails', () => {
        const res = List.new({ ...args, title: '' }, meta);

        expect(Result.isErr(res)).toBe(true);
      });
    });

    describe('list.member.appended', () => {
      it('should push exactly one list.member.appended event on success', () => {
        const list = List.reconstruct(args);
        const memberId = '4' as AccountID;

        const res = list.addMember(memberId, meta);
        expect(Result.isOk(res)).toBe(true);

        const events = list.pullEvents();

        expect(events).toHaveLength(1);
        expect(events[0]).toStrictEqual({
          id: events[0]?.id,
          eventName: 'list.member.appended',
          target: args.id,
          actor: meta.actor,
          occurredAt,
          payload: { memberID: memberId },
        });
      });

      it('should not push any event when member already exists', () => {
        const list = List.reconstruct(args);

        const res = list.addMember('3' as AccountID, meta);

        expect(Result.isErr(res)).toBe(true);
        expect(list.pullEvents()).toStrictEqual([]);
      });

      it('should not add member nor push an event when event ID generation fails', () => {
        const list = List.reconstruct(args);
        const memberId = '4' as AccountID;

        const res = list.addMember(memberId, {
          ...meta,
          idGenerator: failingIDGenerator,
        });

        expect(Result.isErr(res)).toBe(true);
        expect(list.getMemberIds()).toStrictEqual(args.memberIds);
        expect(list.pullEvents()).toStrictEqual([]);
      });

      it('should return an empty array on the second pullEvents call', () => {
        const list = List.reconstruct(args);
        const res = list.addMember('4' as AccountID, meta);
        expect(Result.isOk(res)).toBe(true);

        list.pullEvents();

        expect(list.pullEvents()).toStrictEqual([]);
      });
    });

    describe('list.member.removed', () => {
      it('should push exactly one list.member.removed event on success', () => {
        const list = List.reconstruct(args);
        const memberId = '3' as AccountID;

        const res = list.removeMember(memberId, meta);
        expect(Result.isOk(res)).toBe(true);

        const events = list.pullEvents();

        expect(events).toHaveLength(1);
        expect(events[0]).toStrictEqual({
          id: events[0]?.id,
          eventName: 'list.member.removed',
          target: args.id,
          actor: meta.actor,
          occurredAt,
          payload: { memberID: memberId },
        });
      });

      it('should not remove member nor push an event when event ID generation fails', () => {
        const list = List.reconstruct(args);
        const memberId = '3' as AccountID;

        const res = list.removeMember(memberId, {
          ...meta,
          idGenerator: failingIDGenerator,
        });

        expect(Result.isErr(res)).toBe(true);
        expect(list.getMemberIds()).toStrictEqual(args.memberIds);
        expect(list.pullEvents()).toStrictEqual([]);
      });

      it('should return an empty array on the second pullEvents call', () => {
        const list = List.reconstruct(args);
        const res = list.removeMember('3' as AccountID, meta);
        expect(Result.isOk(res)).toBe(true);

        list.pullEvents();

        expect(list.pullEvents()).toStrictEqual([]);
      });
    });
  });
});
