import { Option, Result } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it } from 'vitest';

import type { AccountID } from '../../../accounts/model/account.js';
import { Note, type NoteID } from '../../../notes/model/note.js';
import { TimelineInvalidFilterRangeError } from '../../model/errors.js';
import { List, type ListID } from '../../model/list.js';
import { InMemoryListRepository, InMemoryTimelineRepository } from './dummy.js';

describe('InMemoryTimelineRepository', () => {
  const dummyPublicNote = Note.new({
    id: '1' as NoteID,
    authorID: '100' as AccountID,
    content: 'Hello world',
    contentsWarningComment: '',
    createdAt: new Date('2023-09-10T00:00:00Z'),
    originalNoteID: Option.none(),
    attachmentFileID: [],
    sendTo: Option.none(),
    visibility: 'PUBLIC',
  });
  const dummyHomeNote = Note.new({
    id: '2' as NoteID,
    authorID: '100' as AccountID,
    content: 'Hello world to Home',
    contentsWarningComment: '',
    createdAt: new Date('2023-09-11T00:00:00Z'),
    originalNoteID: Option.none(),
    attachmentFileID: [],
    sendTo: Option.none(),
    visibility: 'HOME',
  });
  const dummyFollowersNote = Note.new({
    id: '3' as NoteID,
    authorID: '100' as AccountID,
    content: 'Hello world to followers',
    contentsWarningComment: '',
    createdAt: new Date('2023-09-12T00:00:00Z'),
    originalNoteID: Option.none(),
    attachmentFileID: [],
    sendTo: Option.none(),
    visibility: 'FOLLOWERS',
  });
  const dummyDirectNote = Note.new({
    id: '4' as NoteID,
    authorID: '100' as AccountID,
    content: 'Hello world to direct',
    contentsWarningComment: '',
    createdAt: new Date('2023-09-13T00:00:00Z'),
    originalNoteID: Option.none(),
    attachmentFileID: [],
    sendTo: Option.some('101' as AccountID),
    visibility: 'DIRECT',
  });

  const repository = new InMemoryTimelineRepository([
    dummyPublicNote,
    dummyHomeNote,
    dummyFollowersNote,
    dummyDirectNote,
  ]);
  afterEach(() => {
    repository.reset([
      dummyPublicNote,
      dummyHomeNote,
      dummyFollowersNote,
      dummyDirectNote,
    ]);
  });

  it('filter: if beforeID is specified, return notes before the specified note', async () => {
    /**
     * NOTE:
     * new        old
     * ---------------
     *         ↓ beforeID
     * 4,  3,  2,  1
     *           |→ return 1
     */
    const actual = await repository.getAccountTimeline('100' as AccountID, {
      id: '100' as AccountID,
      hasAttachment: true,
      noNsfw: false,
      beforeId: '2' as NoteID,
    });

    expect(Result.isOk(actual)).toBe(true);
    expect(Result.unwrap(actual)).toStrictEqual([dummyPublicNote]);
  });

  it('filter: if afterID is specified, return notes after the specified note', async () => {
    /**
     * NOTE:
     * new        old
     * ---------------
     *             ↓ afterID
     * 4,  3,  2,  1
     *         ←| return 3,2 (4 is filtered out because it is DIRECT note)
     */
    const actual = await repository.getAccountTimeline('100' as AccountID, {
      id: '100' as AccountID,
      hasAttachment: true,
      noNsfw: false,
      afterID: '2' as NoteID,
    });

    expect(Result.isOk(actual)).toBe(true);
    expect(Result.unwrap(actual)).toStrictEqual([
      dummyFollowersNote,
      dummyHomeNote,
    ]);
  });

  it('filter: if after/beforeID are not specified, return 20 notes from the latest note', async () => {
    const actual = await repository.getAccountTimeline('100' as AccountID, {
      id: '100' as AccountID,
      hasAttachment: true,
      noNsfw: false,
    });

    expect(Result.isOk(actual)).toBe(true);
    expect(Result.unwrap(actual)).toHaveLength(3);
  });

  it('filter: if after/beforeID both are specified, return error', async () => {
    const actual = await repository.getAccountTimeline('100' as AccountID, {
      id: '100' as AccountID,
      hasAttachment: true,
      noNsfw: false,
      afterID: '1' as NoteID,
      beforeId: '1' as NoteID,
    });
    expect(Result.isErr(actual)).toBe(true);
    expect(Result.unwrapErr(actual)).toBeInstanceOf(
      TimelineInvalidFilterRangeError,
    );
  });

  it('Account Timeline only returns PUBLIC/HOME/FOLLOWERS notes', async () => {
    const actual = await repository.getAccountTimeline('100' as AccountID, {
      id: '100' as AccountID,
      hasAttachment: true,
      noNsfw: false,
    });
    expect(Result.isOk(actual)).toBe(true);
    expect(Result.unwrap(actual).length).toBe(3);
    expect(
      Result.unwrap(actual)
        .map((v) => v.getVisibility())
        .includes('DIRECT'),
    ).toBe(false);
  });
  it('Home Timeline only returns PUBLIC/HOME/FOLLOWERS notes', async () => {
    const actual = await repository.getHomeTimeline([
      '1' as NoteID,
      '2' as NoteID,
      '3' as NoteID,
      '4' as NoteID,
    ]);
    expect(Result.isOk(actual)).toBe(true);
    expect(Result.unwrap(actual).length).toBe(3);
    expect(
      Result.unwrap(actual)
        .map((v) => v.getVisibility())
        .includes('DIRECT'),
    ).toBe(false);
  });

  it('should fetch list timeline', async () => {
    const actual = await repository.fetchListTimeline(['1' as NoteID]);
    expect(Result.isOk(actual)).toBe(true);
  });

  it('should not return DIRECT notes', async () => {
    const actual = await repository.fetchListTimeline([
      '1' as NoteID,
      '4' as NoteID,
    ]);
    expect(Result.unwrap(actual)).toStrictEqual([dummyPublicNote]);
    expect(Result.unwrap(actual)).not.toStrictEqual([
      dummyPublicNote,
      dummyDirectNote,
    ]);
  });
});

describe('InMemoryListRepository', () => {
  const dummyList = List.new({
    id: '1' as ListID,
    title: 'dummy list',
    publicity: 'PUBLIC',
    ownerId: '100' as AccountID,
    memberIds: ['100' as AccountID, '101' as AccountID] as const,
    createdAt: new Date(),
  });

  const dummyPublicNote = Note.new({
    id: '10' as NoteID,
    authorID: '100' as AccountID,
    content: 'Hello world',
    contentsWarningComment: '',
    createdAt: new Date('2023-09-10T00:00:00Z'),
    originalNoteID: Option.none(),
    attachmentFileID: [],
    sendTo: Option.none(),
    visibility: 'PUBLIC',
  });
  const dummyDirectNote = Note.new({
    id: '14' as NoteID,
    authorID: '100' as AccountID,
    content: 'Hello world to direct',
    contentsWarningComment: '',
    createdAt: new Date('2023-09-13T00:00:00Z'),
    originalNoteID: Option.none(),
    attachmentFileID: [],
    sendTo: Option.some('101' as AccountID),
    visibility: 'DIRECT',
  });

  const repository = new InMemoryListRepository(
    [dummyList],
    [dummyPublicNote, dummyDirectNote],
  );
  afterEach(() => {
    repository.reset([dummyList], [dummyPublicNote, dummyDirectNote]);
  });

  it('should create list', async () => {
    const dummy = List.new({
      id: '2' as ListID,
      title: 'dummy list 2',
      publicity: 'PUBLIC',
      ownerId: '101' as AccountID,
      memberIds: ['101' as AccountID, '102' as AccountID] as const,
      createdAt: new Date(),
    });

    const actual = await repository.create(dummy);
    expect(Result.isOk(actual)).toBe(true);

    const actual2 = await repository.fetchList('2' as ListID);
    expect(Result.isOk(actual2)).toBe(true);
    expect(Result.unwrap(actual2)).toStrictEqual(dummy);
  });

  it('should fetch list', async () => {
    const actual = await repository.fetchList('1' as ListID);
    expect(Result.isOk(actual)).toBe(true);
    expect(Result.unwrap(actual)).toStrictEqual(dummyList);
  });

  it('should return error when list not found', async () => {
    const actual = await repository.fetchList('2' as ListID);
    expect(Result.isErr(actual)).toBe(true);
  });

  it('should fetch lists by owner id', async () => {
    const actual = await repository.fetchListsByOwnerId('100' as AccountID);
    expect(Result.isOk(actual)).toBe(true);
    expect(Result.unwrap(actual)).toStrictEqual([dummyList]);
  });

  it('should fetch list members', async () => {
    const actual = await repository.fetchListMembers('1' as ListID);
    expect(Result.isOk(actual)).toBe(true);
    expect(Result.unwrap(actual)).toStrictEqual([
      '100' as AccountID,
      '101' as AccountID,
    ]);
  });
});
