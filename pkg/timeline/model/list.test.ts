import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.ts';
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

  describe('new', () => {
    it('should create a new list', () => {
      const res = List.new(args, args.ownerId);

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
      const res = List.new({ ...args, title: '' }, args.ownerId);

      expect(Result.isErr(res)).toBe(true);
      expect(Result.unwrapErr(res)).toBeInstanceOf(ListTitleLengthInvalidError);
    });

    it('should return ListTitleLengthInvalidError when title exceeds 100 chars', () => {
      const res = List.new({ ...args, title: 'a'.repeat(101) }, args.ownerId);

      expect(Result.isErr(res)).toBe(true);
      expect(Result.unwrapErr(res)).toBeInstanceOf(ListTitleLengthInvalidError);
    });

    it('should return ListTooManyMembersError when memberIds exceeds 250', () => {
      const memberIds = Array.from(
        { length: 251 },
        (_, i) => `${i + 1}` as AccountID,
      );
      const res = List.new({ ...args, memberIds }, args.ownerId);

      expect(Result.isErr(res)).toBe(true);
      expect(Result.unwrapErr(res)).toBeInstanceOf(ListTooManyMembersError);
    });
  });

  it('should add a member to the list', () => {
    const list = List.reconstruct(args);
    const memberId = '4' as AccountID;

    const res = list.addMember(memberId, args.ownerId);

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

    const res = list.addMember(memberId, args.ownerId);

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

    const res = list.addMember(newMemberId, args.ownerId);

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

    const res = list.removeMember(memberId, args.ownerId);

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
        const res = List.new(args, args.ownerId);
        const list = Result.unwrap(res);

        const events = list.pullEvents();

        expect(events).toHaveLength(1);
        const [event] = events;
        expect(event?.eventName).toBe('list.created');
        expect(event?.target).toBe(args.id);
        expect(event?.actor).toBe(args.ownerId);
        expect(event?.payload).toStrictEqual({
          ownerID: args.ownerId,
          title: args.title,
        });
      });

      it('should not push any event when validation fails', () => {
        const res = List.new({ ...args, title: '' }, args.ownerId);

        expect(Result.isErr(res)).toBe(true);
      });
    });

    describe('list.member.appended', () => {
      it('should push exactly one list.member.appended event on success', () => {
        const list = List.reconstruct(args);
        const memberId = '4' as AccountID;

        const res = list.addMember(memberId, args.ownerId);
        expect(Result.isOk(res)).toBe(true);

        const events = list.pullEvents();

        expect(events).toHaveLength(1);
        const [event] = events;
        expect(event?.eventName).toBe('list.member.appended');
        expect(event?.target).toBe(args.id);
        expect(event?.actor).toBe(args.ownerId);
        expect(event?.payload).toStrictEqual({ memberID: memberId });
      });

      it('should not push any event when member already exists', () => {
        const list = List.reconstruct(args);

        const res = list.addMember('3' as AccountID, args.ownerId);

        expect(Result.isErr(res)).toBe(true);
        expect(list.pullEvents()).toStrictEqual([]);
      });

      it('should return an empty array on the second pullEvents call', () => {
        const list = List.reconstruct(args);
        const res = list.addMember('4' as AccountID, args.ownerId);
        expect(Result.isOk(res)).toBe(true);

        list.pullEvents();

        expect(list.pullEvents()).toStrictEqual([]);
      });
    });

    describe('list.member.removed', () => {
      it('should push exactly one list.member.removed event on success', () => {
        const list = List.reconstruct(args);
        const memberId = '3' as AccountID;

        const res = list.removeMember(memberId, args.ownerId);
        expect(Result.isOk(res)).toBe(true);

        const events = list.pullEvents();

        expect(events).toHaveLength(1);
        const [event] = events;
        expect(event?.eventName).toBe('list.member.removed');
        expect(event?.target).toBe(args.id);
        expect(event?.actor).toBe(args.ownerId);
        expect(event?.payload).toStrictEqual({ memberID: memberId });
      });

      it('should return an empty array on the second pullEvents call', () => {
        const list = List.reconstruct(args);
        const res = list.removeMember('3' as AccountID, args.ownerId);
        expect(Result.isOk(res)).toBe(true);

        list.pullEvents();

        expect(list.pullEvents()).toStrictEqual([]);
      });
    });
  });
});
