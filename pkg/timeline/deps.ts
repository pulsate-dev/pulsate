import { Cat, Ether } from '@mikuroxina/mini-fn';
import { AuthenticateMiddlewareService } from '../adaptors/authenticateMiddleware.ts';
import { prismaClient } from '../adaptors/prisma.ts';
import { valkeyClient } from '../adaptors/valkey.ts';
import {
  accountModule,
  accountModuleEther,
  dummyAccountModuleFacade,
} from '../intermodule/account.ts';
import { noteModule } from '../intermodule/note.ts';
import {
  listRepositoryInstance,
  timelineCacheRepositoryInstance,
} from '../intermodule/timeline.ts';
import { eventPublisherEther } from '../internal/event/mod.ts';
import { clockSymbol, snowflakeIDGenerator } from '../internal/id/mod.ts';
import { NoteEventHandler } from './adaptor/controller/noteEvent.ts';
import { TimelineController } from './adaptor/controller/timeline.ts';
import {
  inMemoryBookmarkTimelineRepo,
  inMemoryConversationRepo,
  inMemoryTimelineRepo,
} from './adaptor/repository/dummy.ts';
import {
  prismaBookmarkTimelineRepo,
  prismaConversationRepo,
  prismaTimelineRepo,
} from './adaptor/repository/prisma.ts';
import { valkeyTimelineCacheRepo } from './adaptor/repository/valkeyCache.ts';
import {
  listRepoSymbol,
  timelineNotesCacheRepoSymbol,
  timelineRepoSymbol,
} from './model/repository.ts';
import { accountTimeline } from './service/account.ts';
import { appendListMember } from './service/appendMember.ts';
import { createList } from './service/createList.ts';
import { deleteList } from './service/deleteList.ts';
import { editList } from './service/editList.ts';
import { fetchBookmark } from './service/fetchBookmark.ts';
import { fetchConversation } from './service/fetchConversation.ts';
import { fetchList } from './service/fetchList.ts';
import { fetchListMember } from './service/fetchMember.ts';
import { FetchSubscribedListService } from './service/fetchSubscribed.ts';
import { homeTimeline } from './service/home.ts';
import { listTimeline } from './service/list.ts';
import { noteVisibility } from './service/noteVisibility.ts';
import { publicTimeline } from './service/public.ts';
import { PushTimelineService } from './service/push.ts';
import { removeListMember } from './service/removeMember.ts';

const isProduction = process.env.NODE_ENV === 'production';

class Clock {
  now() {
    return BigInt(Date.now());
  }
}
const clock = Ether.newEther(clockSymbol, () => new Clock());
const idGenerator = Ether.compose(clock)(snowflakeIDGenerator(0));

const timelineRepositoryEther = isProduction
  ? prismaTimelineRepo(prismaClient)
  : inMemoryTimelineRepo(undefined, noteModule);
const timelineRepositoryInstanceLocal = Ether.runEther(timelineRepositoryEther);
const timelineRepository = Ether.newEther(
  timelineRepoSymbol,
  () => timelineRepositoryInstanceLocal,
);
const listRepository = Ether.newEther(
  listRepoSymbol,
  () => listRepositoryInstance,
);
export const AuthMiddleware = new AuthenticateMiddlewareService();
const noteVisibilityService = Cat.cat(noteVisibility).feed(
  Ether.compose(accountModuleEther),
).value;
const timelineCacheRepository = isProduction
  ? valkeyTimelineCacheRepo(valkeyClient)
  : Ether.newEther(
      timelineNotesCacheRepoSymbol,
      () => timelineCacheRepositoryInstance,
    );
const bookmarkTimelineRepository = isProduction
  ? prismaBookmarkTimelineRepo(prismaClient)
  : inMemoryBookmarkTimelineRepo();
const conversationRepository = isProduction
  ? prismaConversationRepo(prismaClient)
  : inMemoryConversationRepo();

const fetchSubscribedListService = new FetchSubscribedListService(
  Ether.runEther(listRepository),
);
export const noteEventHandlerInstance = new NoteEventHandler({
  pushTimelineService: new PushTimelineService(
    isProduction ? accountModule : dummyAccountModuleFacade,
    Ether.runEther(noteVisibilityService),
    Ether.runEther(timelineCacheRepository),
    fetchSubscribedListService,
  ),
  noteModule,
});

export const controller = new TimelineController({
  accountTimelineService: Ether.runEther(
    Cat.cat(accountTimeline)
      .feed(Ether.compose(noteVisibilityService))
      .feed(Ether.compose(timelineRepository)).value,
  ),
  createListService: Ether.runEther(
    Cat.cat(createList)
      .feed(Ether.compose(clock))
      .feed(Ether.compose(idGenerator))
      .feed(Ether.compose(listRepository))
      .feed(Ether.compose(eventPublisherEther)).value,
  ),
  editListService: Ether.runEther(
    Cat.cat(editList).feed(Ether.compose(listRepository)).value,
  ),
  fetchListService: Ether.runEther(
    Cat.cat(fetchList).feed(Ether.compose(listRepository)).value,
  ),
  deleteListService: Ether.runEther(
    Cat.cat(deleteList)
      .feed(Ether.compose(listRepository))
      .feed(Ether.compose(eventPublisherEther)).value,
  ),
  accountModule: isProduction ? accountModule : dummyAccountModuleFacade,
  fetchMemberService: Ether.runEther(
    Cat.cat(fetchListMember)
      .feed(Ether.compose(listRepository))
      .feed(Ether.compose(accountModuleEther)).value,
  ),
  listTimelineService: Ether.runEther(
    Cat.cat(listTimeline)
      .feed(Ether.compose(timelineCacheRepository))
      .feed(Ether.compose(timelineRepository)).value,
  ),
  noteModule,
  homeTimeline: Ether.runEther(
    Cat.cat(homeTimeline)
      .feed(Ether.compose(timelineCacheRepository))
      .feed(Ether.compose(timelineRepository)).value,
  ),
  appendListMemberService: Ether.runEther(
    Cat.cat(appendListMember)
      .feed(Ether.compose(listRepository))
      .feed(Ether.compose(eventPublisherEther)).value,
  ),
  removeListMemberService: Ether.runEther(
    Cat.cat(removeListMember)
      .feed(Ether.compose(listRepository))
      .feed(Ether.compose(eventPublisherEther)).value,
  ),
  fetchBookmarkTimelineService: Ether.runEther(
    Cat.cat(fetchBookmark)
      .feed(Ether.compose(timelineRepository))
      .feed(Ether.compose(bookmarkTimelineRepository)).value,
  ),
  fetchConversationService: Ether.runEther(
    Cat.cat(fetchConversation).feed(Ether.compose(conversationRepository))
      .value,
  ),
  publicTimelineService: Ether.runEther(
    Cat.cat(publicTimeline).feed(Ether.compose(timelineRepository)).value,
  ),
});
