import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import { Note, type NoteID } from '../../notes/model/note.js';
import { InMemoryTimelineRepository } from '../adaptor/repository/dummy.js';
import {
  dummyDirectNote,
  dummyFollowersNote,
  dummyHomeNote,
  dummyPublicNote,
} from '../testData/testData.js';
import { PublicTimelineService } from './public.js';

const dummyPublicNote2 = Note.new({
  id: '10' as NoteID,
  authorID: '200' as AccountID,
  content: 'Second public note',
  contentsWarningComment: '',
  originalNoteID: Option.none(),
  attachmentFileID: [],
  sendTo: Option.none(),
  visibility: 'PUBLIC',
  createdAt: new Date('2023/09/15 00:00:00'),
});

describe('PublicTimelineService', () => {
  const timelineRepository = new InMemoryTimelineRepository([
    dummyPublicNote,
    dummyPublicNote2,
    dummyHomeNote,
    dummyFollowersNote,
    dummyDirectNote,
  ]);
  const publicTimelineService = new PublicTimelineService(timelineRepository);

  it('Successfully get public timeline with only PUBLIC notes', async () => {
    const res = await publicTimelineService.fetchPublicTimeline({
      hasAttachment: false,
      noNsfw: false,
    });

    expect(Result.isOk(res)).toBe(true);
    const notes = Result.unwrap(res);

    // Only PUBLIC notes should be returned
    expect(notes).toHaveLength(2);
    for (const note of notes) {
      expect(note.getVisibility()).toBe('PUBLIC');
    }
  });

  it('Successfully get public timeline with beforeId filter', async () => {
    const res = await publicTimelineService.fetchPublicTimeline({
      hasAttachment: false,
      noNsfw: false,
      beforeId: dummyPublicNote2.getID(),
    });

    expect(Result.isOk(res)).toBe(true);
    const notes = Result.unwrap(res);

    // Should return notes before the specified ID
    expect(notes.length).toBeGreaterThan(0);
    for (const note of notes) {
      expect(note.getVisibility()).toBe('PUBLIC');
    }
  });

  it('Error when both beforeId and afterId are specified', async () => {
    const res = await publicTimelineService.fetchPublicTimeline({
      hasAttachment: false,
      noNsfw: false,
      beforeId: dummyPublicNote.getID(),
      afterID: dummyPublicNote2.getID(),
    });

    expect(Result.isErr(res)).toBe(true);
  });
});
