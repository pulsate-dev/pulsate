import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import {
  ListMemberAlreadyExistsError,
  ListTitleLengthInvalidError,
  ListTooManyMembersError,
} from './errors.js';
import { type CreateListArgs, List, type ListID } from './list.js';

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
      const res = List.new(args);

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
      const res = List.new({ ...args, title: '' });

      expect(Result.isErr(res)).toBe(true);
      expect(Result.unwrapErr(res)).toBeInstanceOf(ListTitleLengthInvalidError);
    });

    it('should return ListTitleLengthInvalidError when title exceeds 100 chars', () => {
      const res = List.new({ ...args, title: 'a'.repeat(101) });

      expect(Result.isErr(res)).toBe(true);
      expect(Result.unwrapErr(res)).toBeInstanceOf(ListTitleLengthInvalidError);
    });
  });

  it('should add a member to the list', () => {
    const list = List.reconstruct(args);
    const memberId = '4' as AccountID;

    const res = list.addMember(memberId);

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

    const res = list.addMember(memberId);

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

    const res = list.addMember(newMemberId);

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

    list.removeMember(memberId);

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
});
