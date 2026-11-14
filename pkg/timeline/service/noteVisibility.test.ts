import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, vi } from 'vitest';
import type { Account } from '../../accounts/model/account.ts';
import {
  dummyNormalAccount1,
  dummyNormalAccount2,
  partialAccount1,
} from '../../accounts/testData/testData.ts';
import { dummyAccountModuleFacade } from '../../intermodule/account.ts';
import { generateDummyID } from '../../internal/id/dummy.ts';
import {
  dummyFollowersNote,
  dummyHomeNote,
  dummyNoteAuthorID,
  dummyPublicNote,
} from '../testData/testData.ts';
import { NoteVisibilityService } from './noteVisibility.ts';

describe('NoteVisibilityService', () => {
  const visibilityService = new NoteVisibilityService(dummyAccountModuleFacade);
  const unrelatedAccountID = generateDummyID<Account>();

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
          accountID: dummyNoteAuthorID,
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
        accountID: dummyNormalAccount1.getID(),
        note: dummyPublicNote,
      }),
    ).toBe(true);
    // home
    expect(
      await visibilityService.handle({
        accountID: dummyNormalAccount1.getID(),
        note: dummyHomeNote,
      }),
    ).toBe(true);
    // followers
    expect(
      await visibilityService.handle({
        accountID: dummyNormalAccount1.getID(),
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
        accountID: dummyNormalAccount2.getID(),
        note: dummyPublicNote,
      }),
    ).toBe(true);
    expect(
      await visibilityService.handle({
        accountID: dummyNormalAccount2.getID(),
        note: dummyHomeNote,
      }),
    ).toBe(true);

    expect(
      await visibilityService.handle({
        accountID: dummyNormalAccount2.getID(),
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
      accountID: unrelatedAccountID,
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
        accountID: unrelatedAccountID,
        note: dummyPublicNote,
      }),
    ).toBe(true);
    expect(
      await visibilityService.isVisibleNoteInList({
        accountID: unrelatedAccountID,
        note: dummyHomeNote,
      }),
    ).toBe(true);
    expect(
      await visibilityService.isVisibleNoteInList({
        accountID: unrelatedAccountID,
        note: dummyFollowersNote,
      }),
    ).toBe(false);
  });
});
