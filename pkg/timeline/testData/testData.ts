/*
 * These are dummy data for test, don't use it in production environment
 * */
import { Option } from '@mikuroxina/mini-fn';

import type { Account, AccountID } from '../../accounts/model/account.ts';
import { DUMMY_BASE_DATE, generateDummyID } from '../../internal/id/dummy.ts';
import type { NoteID } from '../../notes/model/note.ts';
import { generateDummyNote } from '../../notes/testData/testData.ts';
import { type CreateListArgs, List } from '../model/list.ts';

/**
 * @description generate dummy list (factory function)
 * @param overrides fields to override the default dummy values
 * @returns {@link List}
 */
export const generateDummyList = (
  overrides: Partial<CreateListArgs> = {},
): List => {
  const createdAt = overrides.createdAt ?? DUMMY_BASE_DATE;
  return List.reconstruct({
    id: generateDummyID<List>(createdAt),
    title: 'test list',
    publicity: 'PUBLIC',
    ownerId: generateDummyID<Account>(createdAt),
    memberIds: [],
    ...overrides,
    createdAt,
  });
};

export const dummyPublicNote = generateDummyNote({
  id: '1' as NoteID,
  authorID: '100' as AccountID,
  content: 'Hello world',
  visibility: 'PUBLIC',
  createdAt: new Date('2023/09/10 00:00:00'),
});
export const dummyHomeNote = generateDummyNote({
  id: '2' as NoteID,
  authorID: '100' as AccountID,
  content: 'Hello world to Home',
  visibility: 'HOME',
  createdAt: new Date('2023/09/20 00:00:00'),
});
export const dummyFollowersNote = generateDummyNote({
  id: '3' as NoteID,
  authorID: '100' as AccountID,
  content: 'Hello world to followers',
  visibility: 'FOLLOWERS',
  createdAt: new Date('2023/09/30 00:00:00'),
});
export const dummyRenote = generateDummyNote({
  id: '5' as NoteID,
  authorID: '100' as AccountID,
  content: '',
  originalNoteID: Option.some('1' as NoteID),
  visibility: 'PUBLIC',
  createdAt: new Date('2023/10/05 00:00:00'),
});
export const dummyDirectNote = generateDummyNote({
  id: '4' as NoteID,
  authorID: '100' as AccountID,
  content: 'Hello world to direct',
  sendTo: Option.some('101' as AccountID),
  visibility: 'DIRECT',
  createdAt: new Date('2023/10/10 00:00:00'),
});
