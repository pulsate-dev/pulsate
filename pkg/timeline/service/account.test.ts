import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, vi } from 'vitest';
import type { Account } from '../../accounts/model/account.ts';
import { generateDummyAccount } from '../../accounts/testData/testData.ts';
import type { PartialAccount } from '../../intermodule/account.ts';
import { dummyAccountModuleFacade } from '../../intermodule/account.ts';
import { DUMMY_BASE_DATE, generateDummyID } from '../../internal/id/dummy.ts';
import { addDuration } from '../../internal/time/mod.ts';
import { generateDummyNote } from '../../notes/testData/testData.ts';
import { InMemoryTimelineRepository } from '../adaptor/repository/dummy.ts';
import { AccountTimelineService } from './account.ts';
import { NoteVisibilityService } from './noteVisibility.ts';

describe('AccountTimelineService', () => {
  const noteVisibilityService = new NoteVisibilityService(
    dummyAccountModuleFacade,
  );

  const author = generateDummyAccount();
  const dummyAccount1 = generateDummyAccount();
  const dummyPublicNote = generateDummyNote({
    authorID: author.getID(),
    content: 'Hello world',
    createdAt: DUMMY_BASE_DATE,
    visibility: 'PUBLIC',
  });
  const dummyHomeNote = generateDummyNote({
    authorID: author.getID(),
    content: 'Hello world to Home',
    createdAt: addDuration(DUMMY_BASE_DATE, { days: 1 }),
    visibility: 'HOME',
  });
  const dummyFollowersNote = generateDummyNote({
    authorID: author.getID(),
    content: 'Hello world to followers',
    createdAt: addDuration(DUMMY_BASE_DATE, { days: 2 }),
    visibility: 'FOLLOWERS',
  });
  const dummyDirectNote = generateDummyNote({
    authorID: author.getID(),
    content: 'Hello world to direct',
    createdAt: addDuration(DUMMY_BASE_DATE, { days: 3 }),
    sendTo: Option.some(dummyAccount1.getID()),
    visibility: 'DIRECT',
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
    const res = await accountTimelineService.handle(author.getID(), {
      id: dummyAccount1.getID(),
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
    const res = await accountTimelineService.handle(author.getID(), {
      id: generateDummyID<Account>(),
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
