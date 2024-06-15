import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, vi } from 'vitest';

import { type AccountID } from '../../accounts/model/account.js';
import { AccountModule } from '../../intermodule/account.js';
import {
  dummyDirectNote,
  dummyFollowersNote,
  dummyHomeNote,
  dummyPublicNote,
  partialAccount1,
} from '../testData/testData.js';
import { NoteVisibilityService } from './noteVisibility.js';

describe('NoteVisibilityService', () => {
  const accountModule = new AccountModule();
  const visibilityService = new NoteVisibilityService(accountModule);

  it("when author's note: return true", async () => {
    vi.spyOn(accountModule, 'fetchFollowers').mockImplementation(async () => {
      return Result.ok([partialAccount1]);
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
          accountID: '100' as AccountID,
          note,
        }),
      ).toBe(true);
    }
  });

  it('when direct note: return true if sendTo is accountID', async () => {
    vi.spyOn(accountModule, 'fetchFollowers').mockImplementation(async () => {
      return Result.ok([partialAccount1]);
    });

    const res = await visibilityService.handle({
      accountID: '101' as AccountID,
      note: dummyDirectNote,
    });
    expect(res).toBe(true);

    const res2 = await visibilityService.handle({
      accountID: '0' as AccountID,
      note: dummyDirectNote,
    });
    expect(res2).toBe(false);
  });

  it('when following: return true if public,home,followers', async () => {
    vi.spyOn(accountModule, 'fetchFollowers').mockImplementation(async () => {
      return Result.ok([partialAccount1]);
    });
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
    vi.spyOn(accountModule, 'fetchFollowers').mockImplementation(async () => {
      return Result.ok([partialAccount1]);
    });

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
    vi.spyOn(accountModule, 'fetchFollowers').mockImplementation(async () => {
      return Result.ok([partialAccount1]);
    });

    const res = await visibilityService.handle({
      accountID: '0' as AccountID,
      note: dummyPublicNote,
    });
    expect(res).toBe(true);
  });

  it("homeTimelineVisibilityCheck: return true if visibility is not 'DIRECT'", async () => {
    vi.spyOn(accountModule, 'fetchFollowers').mockImplementation(async () =>
      Result.ok([partialAccount1]),
    );

    expect(
      await visibilityService.isVisibleNoteInHomeTimeline({
        accountID: '0' as AccountID,
        note: dummyPublicNote,
      }),
    ).toBe(true);
    expect(
      await visibilityService.isVisibleNoteInHomeTimeline({
        accountID: '0' as AccountID,
        note: dummyHomeNote,
      }),
    ).toBe(true);
    expect(
      await visibilityService.isVisibleNoteInHomeTimeline({
        accountID: '0' as AccountID,
        note: dummyFollowersNote,
      }),
    ).toBe(true);
    expect(
      await visibilityService.isVisibleNoteInHomeTimeline({
        accountID: '0' as AccountID,
        note: dummyDirectNote,
      }),
    ).toBe(false);
  });
});
