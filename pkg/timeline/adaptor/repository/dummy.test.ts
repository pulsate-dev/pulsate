import { Option, Result } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it } from 'vitest';
import type { Account, AccountID } from '../../../accounts/model/account.ts';
import { generateDummyAccount } from '../../../accounts/testData/testData.ts';
import {
  DUMMY_BASE_DATE,
  generateDummyID,
} from '../../../internal/id/dummy.ts';
import { addDuration } from '../../../internal/time/mod.ts';
import { DirectNote } from '../../../notes/model/directNote.ts';
import { generateDummyNote } from '../../../notes/testData/testData.ts';
import { TimelineInvalidFilterRangeError } from '../../model/errors.ts';
import type { List } from '../../model/list.ts';
import { generateDummyList } from '../../testData/testData.ts';
import {
  InMemoryConversationRepository,
  InMemoryListRepository,
  InMemoryTimelineRepository,
} from './dummy.ts';

describe('InMemoryTimelineRepository', () => {
  const authorID = generateDummyID<Account>();
  const recipientID = generateDummyID<Account>();
  const dummyPublicNote = generateDummyNote({
    authorID,
    content: 'Hello world',
    createdAt: DUMMY_BASE_DATE,
    visibility: 'PUBLIC',
  });
  const dummyHomeNote = generateDummyNote({
    authorID,
    content: 'Hello world to Home',
    createdAt: addDuration(DUMMY_BASE_DATE, { days: 1 }),
    visibility: 'HOME',
  });
  const dummyFollowersNote = generateDummyNote({
    authorID,
    content: 'Hello world to followers',
    createdAt: addDuration(DUMMY_BASE_DATE, { days: 2 }),
    visibility: 'FOLLOWERS',
  });
  const dummyDirectNote = generateDummyNote({
    authorID,
    content: 'Hello world to direct',
    createdAt: addDuration(DUMMY_BASE_DATE, { days: 3 }),
    sendTo: Option.some(recipientID),
    visibility: 'DIRECT',
  });
  const dummyNotes = [
    dummyPublicNote,
    dummyHomeNote,
    dummyFollowersNote,
    dummyDirectNote,
  ];

  const repository = new InMemoryTimelineRepository(dummyNotes);
  afterEach(() => {
    repository.reset(dummyNotes);
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
    const actual = await repository.getAccountTimeline(authorID, {
      id: authorID,
      hasAttachment: true,
      noNsfw: false,
      beforeId: dummyHomeNote.getID(),
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
    const actual = await repository.getAccountTimeline(authorID, {
      id: authorID,
      hasAttachment: true,
      noNsfw: false,
      afterId: dummyHomeNote.getID(),
    });

    expect(Result.isOk(actual)).toBe(true);
    expect(Result.unwrap(actual)).toStrictEqual([
      dummyFollowersNote,
      dummyHomeNote,
    ]);
  });

  it('filter: if after/beforeID are not specified, return 20 notes from the latest note', async () => {
    const actual = await repository.getAccountTimeline(authorID, {
      id: authorID,
      hasAttachment: true,
      noNsfw: false,
    });

    expect(Result.isOk(actual)).toBe(true);
    expect(Result.unwrap(actual)).toHaveLength(3);
  });

  it('filter: if after/beforeID both are specified, return error', async () => {
    const actual = await repository.getAccountTimeline(authorID, {
      id: authorID,
      hasAttachment: true,
      noNsfw: false,
      afterId: dummyPublicNote.getID(),
      beforeId: dummyPublicNote.getID(),
    });
    expect(Result.isErr(actual)).toBe(true);
    expect(Result.unwrapErr(actual)).toBeInstanceOf(
      TimelineInvalidFilterRangeError,
    );
  });

  it('Account Timeline only returns PUBLIC/HOME/FOLLOWERS notes', async () => {
    const actual = await repository.getAccountTimeline(authorID, {
      id: authorID,
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
    const actual = await repository.getHomeTimeline(
      dummyNotes.map((v) => v.getID()),
      {
        hasAttachment: false,
        noNsfw: false,
      },
    );
    expect(Result.isOk(actual)).toBe(true);
    expect(Result.unwrap(actual).length).toBe(3);
    expect(
      Result.unwrap(actual)
        .map((v) => v.getVisibility())
        .includes('DIRECT'),
    ).toBe(false);
  });

  it('Home Timeline with beforeId cursor', async () => {
    const actual = await repository.getHomeTimeline(
      [
        dummyPublicNote.getID(),
        dummyHomeNote.getID(),
        dummyFollowersNote.getID(),
      ],
      {
        hasAttachment: false,
        noNsfw: false,
        beforeId: dummyHomeNote.getID(),
      },
    );
    expect(Result.isOk(actual)).toBe(true);
    // beforeId dummyHomeNote より古いノートのみ返す (createdAt降順で2より後ろ)
    expect(Result.unwrap(actual).map((v) => v.getID())).toStrictEqual([
      dummyPublicNote.getID(),
    ]);
  });

  it('Home Timeline with afterID cursor', async () => {
    const actual = await repository.getHomeTimeline(
      [
        dummyPublicNote.getID(),
        dummyHomeNote.getID(),
        dummyFollowersNote.getID(),
      ],
      {
        hasAttachment: false,
        noNsfw: false,
        afterId: dummyHomeNote.getID(),
      },
    );
    expect(Result.isOk(actual)).toBe(true);
    // afterID dummyHomeNote より新しいノートのみ返す (createdAt降順で2より前)
    expect(Result.unwrap(actual).map((v) => v.getID())).toStrictEqual([
      dummyFollowersNote.getID(),
    ]);
  });

  it('Home Timeline with both beforeId and afterID returns error', async () => {
    const actual = await repository.getHomeTimeline(
      [
        dummyPublicNote.getID(),
        dummyHomeNote.getID(),
        dummyFollowersNote.getID(),
      ],
      {
        hasAttachment: false,
        noNsfw: false,
        beforeId: dummyFollowersNote.getID(),
        afterId: dummyPublicNote.getID(),
      },
    );
    expect(Result.isErr(actual)).toBe(true);
  });

  it('should fetch list timeline', async () => {
    const actual = await repository.fetchListTimeline(
      [dummyPublicNote.getID()],
      {
        hasAttachment: false,
        noNsfw: false,
      },
    );
    expect(Result.isOk(actual)).toBe(true);
  });

  it('should not return DIRECT notes', async () => {
    const actual = await repository.fetchListTimeline(
      [dummyPublicNote.getID(), dummyDirectNote.getID()],
      {
        hasAttachment: false,
        noNsfw: false,
      },
    );
    expect(Result.unwrap(actual)).toStrictEqual([dummyPublicNote]);
    expect(Result.unwrap(actual)).not.toStrictEqual([
      dummyPublicNote,
      dummyDirectNote,
    ]);
  });
});

describe('InMemoryListRepository', () => {
  const ownerID = generateDummyID<Account>();
  const memberID = generateDummyID<Account>();
  const dummyList = generateDummyList({
    title: 'dummy list',
    ownerId: ownerID,
    memberIds: [ownerID, memberID],
  });

  const dummyPublicNote = generateDummyNote({
    authorID: ownerID,
    content: 'Hello world',
    visibility: 'PUBLIC',
  });
  const dummyDirectNote = generateDummyNote({
    authorID: ownerID,
    content: 'Hello world to direct',
    createdAt: addDuration(DUMMY_BASE_DATE, { days: 3 }),
    sendTo: Option.some(memberID),
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
    const otherMemberID = generateDummyID<Account>();
    const dummy = generateDummyList({
      title: 'dummy list 2',
      ownerId: memberID,
      memberIds: [memberID, otherMemberID],
    });

    const actual = await repository.create(dummy);
    expect(Result.isOk(actual)).toBe(true);

    const actual2 = await repository.fetchList(dummy.getId());
    expect(Result.isOk(actual2)).toBe(true);
    expect(Result.unwrap(actual2)).toStrictEqual(dummy);
  });

  it('should fetch list', async () => {
    const actual = await repository.fetchList(dummyList.getId());
    expect(Result.isOk(actual)).toBe(true);
    expect(Result.unwrap(actual)).toStrictEqual(dummyList);
  });

  it('should return error when list not found', async () => {
    const actual = await repository.fetchList(generateDummyID<List>());
    expect(Result.isErr(actual)).toBe(true);
  });

  it('should fetch lists by owner id', async () => {
    const actual = await repository.fetchListsByOwnerId(ownerID);
    expect(Result.isOk(actual)).toBe(true);
    expect(Result.unwrap(actual)).toStrictEqual([dummyList]);
  });

  it('should fetch list members', async () => {
    const actual = await repository.fetchListMembers(dummyList.getId());
    expect(Result.isOk(actual)).toBe(true);
    expect(Result.unwrap(actual)).toStrictEqual([ownerID, memberID]);
  });
});

describe('InMemoryConversationRepository', () => {
  const directNoteFactory = (
    authorID: AccountID,
    recipientID: AccountID,
    createdAt: Date,
  ) =>
    Result.unwrap(
      DirectNote.new(
        {
          id: generateDummyID<DirectNote>(createdAt),
          authorID,
          recipientID,
          content: 'this is a test note',
          contentsWarningComment: '',
          attachmentFileID: [],
          createdAt,
        },
        authorID,
      ),
    );

  const accountA = generateDummyAccount().getID();
  const accountB = generateDummyAccount().getID();
  const accountWithoutNotes = generateDummyAccount().getID();

  const testMap = [
    // A-->B
    directNoteFactory(accountA, accountB, DUMMY_BASE_DATE),
    // A-->B
    directNoteFactory(
      accountA,
      accountB,
      addDuration(DUMMY_BASE_DATE, { days: 1 }),
    ),
    // B-->A
    directNoteFactory(
      accountB,
      accountA,
      addDuration(DUMMY_BASE_DATE, { days: 2 }),
    ),
    // B-->A
    directNoteFactory(
      accountB,
      accountA,
      addDuration(DUMMY_BASE_DATE, { days: 3 }),
    ),
  ];
  const latestNote = testMap[3];
  const repo = new InMemoryConversationRepository(testMap);

  it('should return newest note', async () => {
    const res = await repo.findByAccountID(accountA);

    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res)).toStrictEqual([
      {
        id: accountB,
        lastSentAt: addDuration(DUMMY_BASE_DATE, { days: 3 }),
        latestNoteID: latestNote?.getID(),
        latestNoteAuthor: accountB,
      },
    ]);
  });

  it('should return newest note: not received yet', async () => {
    const res = await repo.findByAccountID(accountB);

    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res)).toStrictEqual([
      {
        id: accountA,
        lastSentAt: addDuration(DUMMY_BASE_DATE, { days: 3 }),
        latestNoteID: latestNote?.getID(),
        latestNoteAuthor: accountB,
      },
    ]);
  });

  it('should return empty array when no notes are found', async () => {
    const res = await repo.findByAccountID(accountWithoutNotes);

    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res)).toStrictEqual([]);
  });
});
