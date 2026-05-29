import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, vi } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import { partialAccount1 } from '../../accounts/testData/testData.js';
import { dummyAccountModuleFacade } from '../../intermodule/account.js';
import {
  dummyFollowersNote,
  dummyHomeNote,
  dummyPublicNote,
} from '../testData/testData.js';
import { NoteVisibilityService } from './noteVisibility.js';

describe('NoteVisibilityService', () => {
  const visibilityService = new NoteVisibilityService(dummyAccountModuleFacade);

  it("when author's note: return true", async () => {
    vi.spyOn(dummyAccountModuleFacade, 'fetchFollowers').mockImplementation(
      async () => {
        return Result.ok([partialAccount1]);
      },
    );

    const testObjects = [dummyPublicNote, dummyHomeNote, dummyFollowersNote];
    for (const note of testObjects) {
      expect(
        await visibilityService.handle({
          accountID: '100' as AccountID,
          note,
        }),
      ).toBe(true);
    }
  });

  it('when following: return true if public,home,followers', async () => {
    vi.spyOn(dummyAccountModuleFacade, 'fetchFollowers').mockImplementation(
      async () => {
        return Result.ok([partialAccount1]);
      },
    );
    // public
    expect(
      await visibilityService.handle({
        accountID: '101' as AccountID,
        note: dummyPublicNote,
      }),
    ).toBe(true);
    // home
    expect(
      await visibilityService.handle({
        accountID: '101' as AccountID,
        note: dummyHomeNote,
      }),
    ).toBe(true);
    // followers
    expect(
      await visibilityService.handle({
        accountID: '101' as AccountID,
        note: dummyFollowersNote,
      }),
    ).toBe(true);
  });

  it('when not following: return true if public, home', async () => {
    vi.spyOn(dummyAccountModuleFacade, 'fetchFollowers').mockImplementation(
      async () => {
        return Result.ok([partialAccount1]);
      },
    );

    expect(
      await visibilityService.handle({
        accountID: '102' as AccountID,
        note: dummyPublicNote,
      }),
    ).toBe(true);
    expect(
      await visibilityService.handle({
        accountID: '102' as AccountID,
        note: dummyHomeNote,
      }),
    ).toBe(true);

    expect(
      await visibilityService.handle({
        accountID: '102' as AccountID,
        note: dummyFollowersNote,
      }),
    ).toBe(false);
  });

  it('always return true if public', async () => {
    vi.spyOn(dummyAccountModuleFacade, 'fetchFollowers').mockImplementation(
      async () => {
        return Result.ok([partialAccount1]);
      },
    );

    const res = await visibilityService.handle({
      accountID: '0' as AccountID,
      note: dummyPublicNote,
    });
    expect(res).toBe(true);
  });

  it("listVisibilityCheck: return false only for 'FOLLOWERS'", async () => {
    vi.spyOn(dummyAccountModuleFacade, 'fetchFollowers').mockImplementation(
      async () => Result.ok([partialAccount1]),
    );

    expect(
      await visibilityService.isVisibleNoteInList({
        accountID: '0' as AccountID,
        note: dummyPublicNote,
      }),
    ).toBe(true);
    expect(
      await visibilityService.isVisibleNoteInList({
        accountID: '0' as AccountID,
        note: dummyHomeNote,
      }),
    ).toBe(true);
    expect(
      await visibilityService.isVisibleNoteInList({
        accountID: '0' as AccountID,
        note: dummyFollowersNote,
      }),
    ).toBe(false);
  });
});
