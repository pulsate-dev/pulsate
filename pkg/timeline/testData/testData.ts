/*
 * These are dummy data for test, don't use it in production environment
 * */
import { Option } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import { Note, type NoteID } from '../../notes/model/note.js';

export const dummyPublicNote = Note.new({
  id: '1' as NoteID,
  authorID: '100' as AccountID,
  content: 'Hello world',
  contentsWarningComment: '',
  originalNoteID: Option.none(),
  attachmentFileID: [],
  sendTo: Option.none(),
  visibility: 'PUBLIC',
  createdAt: new Date('2023/09/10 00:00:00'),
});
export const dummyHomeNote = Note.new({
  id: '2' as NoteID,
  authorID: '100' as AccountID,
  content: 'Hello world to Home',
  contentsWarningComment: '',
  originalNoteID: Option.none(),
  attachmentFileID: [],
  sendTo: Option.none(),
  visibility: 'HOME',
  createdAt: new Date('2023/09/20 00:00:00'),
});
export const dummyFollowersNote = Note.new({
  id: '3' as NoteID,
  authorID: '100' as AccountID,
  content: 'Hello world to followers',
  contentsWarningComment: '',
  originalNoteID: Option.none(),
  attachmentFileID: [],
  sendTo: Option.none(),
  visibility: 'FOLLOWERS',
  createdAt: new Date('2023/09/30 00:00:00'),
});
export const dummyDirectNote = Note.new({
  id: '4' as NoteID,
  authorID: '100' as AccountID,
  content: 'Hello world to direct',
  contentsWarningComment: '',
  originalNoteID: Option.none(),
  attachmentFileID: [],
  sendTo: Option.some('101' as AccountID),
  visibility: 'DIRECT',
  createdAt: new Date('2023/10/10 00:00:00'),
});
