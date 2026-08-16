import { Ether, Result } from '@mikuroxina/mini-fn';
import { isProduction } from '../adaptors/env.ts';
import { prismaClient } from '../adaptors/prisma.ts';
import { valkeyClient } from '../adaptors/valkey.ts';
import type { Note } from '../notes/model/note.ts';
import { InMemoryListRepository } from '../timeline/adaptor/repository/dummy.ts';
import { InMemoryTimelineCacheRepository } from '../timeline/adaptor/repository/dummyCache.ts';
import { PrismaListRepository } from '../timeline/adaptor/repository/prisma.ts';
import { ValkeyTimelineCacheRepository } from '../timeline/adaptor/repository/valkeyCache.ts';
import { FetchSubscribedListService } from '../timeline/service/fetchSubscribed.ts';
import { NoteVisibilityService } from '../timeline/service/noteVisibility.ts';
import { PushTimelineService } from '../timeline/service/push.ts';
import { accountModule, dummyAccountModuleFacade } from './account.ts';

export class TimelineModuleFacade {
  readonly #pushTimelineService: PushTimelineService;
  constructor(pushTimelineService: PushTimelineService) {
    this.#pushTimelineService = pushTimelineService;
  }

  /*
   * @description Push note to timeline
   * @param note to be pushed
   * */
  async pushNoteToTimeline(note: Note): Promise<Result.Result<Error, void>> {
    const res = await this.#pushTimelineService.handle(note);
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }
}
export const timelineModuleFacadeSymbol =
  Ether.newEtherSymbol<TimelineModuleFacade>();
export const timelineModuleFacadeEther = Ether.newEther(
  timelineModuleFacadeSymbol,
  () => timelineModuleFacade,
);

// NOTE: Shared TimelineCacheRepository instance to ensure it's the same instance used across modules
export const timelineCacheRepositoryInstance = isProduction
  ? new ValkeyTimelineCacheRepository(valkeyClient())
  : new InMemoryTimelineCacheRepository();

// NOTE: Shared ListRepository instance
export const listRepositoryInstance = isProduction
  ? new PrismaListRepository(prismaClient)
  : new InMemoryListRepository();

export const timelineModuleFacade = new TimelineModuleFacade(
  new PushTimelineService(
    accountModule,
    new NoteVisibilityService(accountModule),
    timelineCacheRepositoryInstance,
    new FetchSubscribedListService(listRepositoryInstance),
  ),
);

/**
 * Dummy timeline module.\
 * **NOTE: MUST USE THIS OBJECT FOR TESTING ONLY**
 * @param timelineCacheRepository
 */
export const dummyTimelineModuleFacade = (
  timelineCacheRepository: InMemoryTimelineCacheRepository,
) =>
  new TimelineModuleFacade(
    new PushTimelineService(
      dummyAccountModuleFacade,
      new NoteVisibilityService(dummyAccountModuleFacade),
      timelineCacheRepository,
      new FetchSubscribedListService(new InMemoryListRepository()),
    ),
  );
