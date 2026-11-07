import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import { generateDummyNote } from '../../notes/testData/testData.ts';
import { InMemoryTimelineRepository } from '../adaptor/repository/dummy.ts';
import {
  dummyDirectNote,
  dummyFollowersNote,
  dummyHomeNote,
  dummyPublicNote,
} from '../testData/testData.ts';
import { PublicTimelineService } from './public.ts';

const dummyPublicNote2 = generateDummyNote({
  content: 'Second public note',
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

  it('Successfully get public timeline with afterId filter', async () => {
    const res = await publicTimelineService.fetchPublicTimeline({
      hasAttachment: false,
      noNsfw: false,
      afterId: dummyPublicNote.getID(),
    });

    expect(Result.isOk(res)).toBe(true);
    const notes = Result.unwrap(res);

    expect(notes.length).toBe(1);
    for (const note of notes) {
      expect(note.getVisibility()).toBe('PUBLIC');
    }
  });

  it('Error when both beforeId and afterId are specified', async () => {
    const res = await publicTimelineService.fetchPublicTimeline({
      hasAttachment: false,
      noNsfw: false,
      beforeId: dummyPublicNote.getID(),
      afterId: dummyPublicNote2.getID(),
    });

    expect(Result.isErr(res)).toBe(true);
  });
});
