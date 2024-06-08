import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, vi } from 'vitest';

import { Account, type AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import { AccountModule } from '../../intermodule/account.js';
import { Note, type NoteID } from '../../notes/model/note.js';
import { InMemoryTimelineRepository } from '../adaptor/repository/dummy.js';
import { AccountTimelineService } from './account.js';
import { NoteVisibilityService } from './noteVisibility.js';

describe('AccountTimelineService', () => {
  const accountModule = new AccountModule();
  const visibilityService = new NoteVisibilityService(accountModule);

  const dummyPublicNote = Note.new({
    id: '1' as ID<NoteID>,
    authorID: '100' as ID<AccountID>,
    content: 'Hello world',
    contentsWarningComment: '',
    createdAt: new Date(),
    originalNoteID: Option.none(),
    sendTo: Option.none(),
    visibility: 'PUBLIC',
  });
  const dummyHomeNote = Note.new({
    id: '2' as ID<NoteID>,
    authorID: '100' as ID<AccountID>,
    content: 'Hello world to Home',
    contentsWarningComment: '',
    createdAt: new Date(),
    originalNoteID: Option.none(),
    sendTo: Option.none(),
    visibility: 'HOME',
  });
  const dummyFollowersNote = Note.new({
    id: '3' as ID<NoteID>,
    authorID: '100' as ID<AccountID>,
    content: 'Hello world to followers',
    contentsWarningComment: '',
    createdAt: new Date(),
    originalNoteID: Option.none(),
    sendTo: Option.none(),
    visibility: 'FOLLOWERS',
  });
  const dummyDirectNote = Note.new({
    id: '4' as ID<NoteID>,
    authorID: '100' as ID<AccountID>,
    content: 'Hello world to direct',
    contentsWarningComment: '',
    createdAt: new Date(),
    originalNoteID: Option.none(),
    sendTo: Option.some('101' as ID<AccountID>),
    visibility: 'DIRECT',
  });
  const dummyAccount1 = Account.new({
    id: '101' as ID<AccountID>,
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
  const timelineRepository = new InMemoryTimelineRepository([
    dummyPublicNote,
    dummyHomeNote,

    dummyFollowersNote,
    dummyDirectNote,
  ]);
  const accountTimelineService = new AccountTimelineService(
    visibilityService,
    timelineRepository,
  );

  it('if following', async () => {
    vi.spyOn(accountModule, 'fetchFollowers').mockImplementation(async () => {
      return Result.ok([dummyAccount1]);
    });
    const res = await accountTimelineService.handle('100' as ID<AccountID>, {
      id: '101' as ID<AccountID>,
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
    vi.spyOn(accountModule, 'fetchFollowers').mockImplementation(async () => {
      return Result.ok([dummyAccount1]);
    });
    const res = await accountTimelineService.handle('100' as ID<AccountID>, {
      id: '0' as ID<AccountID>,
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
