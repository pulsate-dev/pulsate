import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, vi } from 'vitest';

import { Account, type AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import { AccountModule } from '../../intermodule/account.js';
import { Note, type NoteID } from '../../notes/model/note.js';
import { NoteVisibilityService } from './noteVisibility.js';

describe('NoteVisibilityService', () => {
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

  it("when author's note: return true", async () => {
    vi.spyOn(accountModule, 'fetchFollowers').mockImplementation(async () => {
      return Result.ok([dummyAccount1]);
    });

    const testObjects = [
      dummyPublicNote,
      dummyHomeNote,
      dummyFollowersNote,
      dummyDirectNote,
    ];
    for (const note of testObjects) {
      expect(
        await visibilityService.handle({
          accountID: '100' as ID<AccountID>,
          note,
        }),
      ).toBe(true);
    }
  });

  it('when direct note: return true if sendTo is accountID', async () => {
    vi.spyOn(accountModule, 'fetchFollowers').mockImplementation(async () => {
      return Result.ok([dummyAccount1]);
    });

    const res = await visibilityService.handle({
      accountID: '101' as ID<AccountID>,
      note: dummyDirectNote,
    });
    expect(res).toBe(true);

    const res2 = await visibilityService.handle({
      accountID: '0' as ID<AccountID>,
      note: dummyDirectNote,
    });
    expect(res2).toBe(false);
  });

  it('when following: return true if public,home,followers', async () => {
    vi.spyOn(accountModule, 'fetchFollowers').mockImplementation(async () => {
      return Result.ok([dummyAccount1]);
    });
    // public
    expect(
      await visibilityService.handle({
        accountID: '101' as ID<AccountID>,
        note: dummyPublicNote,
      }),
    ).toBe(true);
    // home
    expect(
      await visibilityService.handle({
        accountID: '101' as ID<AccountID>,
        note: dummyHomeNote,
      }),
    ).toBe(true);
    // followers
    expect(
      await visibilityService.handle({
        accountID: '101' as ID<AccountID>,
        note: dummyFollowersNote,
      }),
    ).toBe(true);
  });

  it('when not following: return true if public, home', async () => {
    vi.spyOn(accountModule, 'fetchFollowers').mockImplementation(async () => {
      return Result.ok([dummyAccount1]);
    });

    expect(
      await visibilityService.handle({
        accountID: '102' as ID<AccountID>,
        note: dummyPublicNote,
      }),
    ).toBe(true);
    expect(
      await visibilityService.handle({
        accountID: '102' as ID<AccountID>,
        note: dummyHomeNote,
      }),
    ).toBe(true);

    expect(
      await visibilityService.handle({
        accountID: '102' as ID<AccountID>,
        note: dummyFollowersNote,
      }),
    ).toBe(false);
  });

  it('always return true if public', async () => {
    vi.spyOn(accountModule, 'fetchFollowers').mockImplementation(async () => {
      return Result.ok([dummyAccount1]);
    });

    const res = await visibilityService.handle({
      accountID: '0' as ID<AccountID>,
      note: dummyPublicNote,
    });
    expect(res).toBe(true);
  });
});
