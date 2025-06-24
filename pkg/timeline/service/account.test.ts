import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, vi } from 'vitest';

import { Account, type AccountID } from '../../accounts/model/account.js';
import type { PartialAccount } from '../../intermodule/account.js';
import { dummyAccountModuleFacade } from '../../intermodule/account.js';
import { Note, type NoteID } from '../../notes/model/note.js';
import { InMemoryTimelineRepository } from '../adaptor/repository/dummy.js';
import { AccountTimelineService } from './account.js';
import { NoteVisibilityService } from './noteVisibility.js';

describe('AccountTimelineService', () => {
  const noteVisibilityService = new NoteVisibilityService(
    dummyAccountModuleFacade,
  );

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
  const dummyAccount1 = Account.new({
    id: '101' as AccountID,
    bio: 'this is test user',
    mail: 'john@example.com',
    name: '@john@example.com',
    nickname: 'John Doe',
    passphraseHash: '',
    role: 'normal',
    silenced: 'normal',
    status: 'active',
    frozen: 'normal',
    createdAt: new Date(),
  });
  const partialAccount1: PartialAccount = {
    id: dummyAccount1.getID(),
    name: dummyAccount1.getName(),
    nickname: dummyAccount1.getNickname(),
    bio: dummyAccount1.getBio(),
  };
  const timelineRepository = new InMemoryTimelineRepository([
    dummyPublicNote,
    dummyHomeNote,

    dummyFollowersNote,
    dummyDirectNote,
  ]);
  const accountTimelineService = new AccountTimelineService({
    noteVisibilityService,
    timelineRepository,
  });

  it('if following', async () => {
    vi.spyOn(dummyAccountModuleFacade, 'fetchFollowers').mockImplementation(
      async () => {
        return Result.ok([partialAccount1]);
      },
    );
    const res = await accountTimelineService.handle('100' as AccountID, {
      id: '101' as AccountID,
      hasAttachment: false,
      noNsfw: false,
    });
    const unwrapped = Result.unwrap(res);

    expect(unwrapped.length).toBe(3);
    // NOTE: AccountTimeline not include direct note
    expect(
      unwrapped.map((v) => v.getVisibility() === 'DIRECT').includes(true),
    ).toBe(false);
  });

  it('if not following', async () => {
    vi.spyOn(dummyAccountModuleFacade, 'fetchFollowers').mockImplementation(
      async () => {
        return Result.ok([partialAccount1]);
      },
    );
    const res = await accountTimelineService.handle('100' as AccountID, {
      id: '0' as AccountID,
      hasAttachment: false,
      noNsfw: false,
    });
    const unwrapped = Result.unwrap(res);

    expect(unwrapped.length).toBe(2);
    // NOTE: AccountTimeline not include direct note
    expect(
      unwrapped.map((v) => v.getVisibility() === 'DIRECT').includes(true),
    ).toBe(false);
    expect(
      unwrapped.map((v) => v.getVisibility() === 'FOLLOWERS').includes(true),
    ).toBe(false);
  });
});
