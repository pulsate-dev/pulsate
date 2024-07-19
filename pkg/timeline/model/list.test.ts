import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
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

  it('should create a new list', () => {
    const list = List.new(args);

    expect(list.getId()).toBe(args.id);
    expect(list.getTitle()).toBe(args.title);
    expect(list.isPublic()).toBe(true);
    expect(list.getOwnerId()).toBe(args.ownerId);
    expect(list.getMemberIds()).toEqual(args.memberIds);
    expect(list.getCreatedAt()).toBe(args.createdAt);
  });

  it('should add a member to the list', () => {
    const list = List.new(args);
    const memberId = '4' as AccountID;

    list.addMember(memberId);

    expect(list.getMemberIds()).toStrictEqual([
      '3' as AccountID,
      '4' as AccountID,
    ]);
  });

  it('should not add a member if already in the list', () => {
    const args: CreateListArgs = {
      id: '1' as ListID,
      title: 'My List',
      publicity: 'PUBLIC',
      ownerId: '2' as AccountID,
      memberIds: ['3' as AccountID],
      createdAt: new Date(),
    } as const;
    const list3 = List.new(args);
    const memberId = '3' as AccountID;

    list3.addMember(memberId);

    expect(list3.getMemberIds()).toStrictEqual(['3' as AccountID]);
  });

  it('should remove member from list', () => {
    const args: CreateListArgs = {
      id: '1' as ListID,
      title: 'My List',
      publicity: 'PUBLIC',
      ownerId: '2' as AccountID,
      memberIds: ['3' as AccountID],
      createdAt: new Date(),
    } as const;
    const list3 = List.new(args);
    const memberId = '3' as AccountID;

    list3.removeMember(memberId);

    expect(list3.getMemberIds()).toStrictEqual([]);
  });

  it('should no duplicate member when initialize', () => {
    const args: CreateListArgs = {
      id: '1' as ListID,
      title: 'My List',
      publicity: 'PUBLIC',
      ownerId: '2' as AccountID,
      memberIds: ['3' as AccountID, '3' as AccountID],
      createdAt: new Date(),
    } as const;
    const list3 = List.new(args);
    expect(list3.getMemberIds()).toStrictEqual(['3' as AccountID]);
  });
});
