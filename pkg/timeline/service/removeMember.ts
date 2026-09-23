import { Cat, Ether, Promise, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.ts';
import {
  type EventPublisher,
  eventPublisherSymbol,
} from '../../internal/event/mod.ts';
import {
  ListNotFoundError,
  TimelineInsufficientPermissionError,
} from '../model/errors.ts';
import type { List, ListID } from '../model/list.ts';
import { type ListRepository, listRepoSymbol } from '../model/repository.ts';

export class RemoveListMemberService {
  readonly #listRepository: ListRepository;
  readonly #eventPublisher: EventPublisher;
  constructor(listRepository: ListRepository, eventPublisher: EventPublisher) {
    this.#listRepository = listRepository;
    this.#eventPublisher = eventPublisher;
  }

  /**
   * @description Remove member from list.
   * @param listID
   * @param accountID
   * @param actorID
   */
  async handle(
    listID: ListID,
    accountID: AccountID,
    actorID: AccountID,
  ): Promise<Result.Result<Error, void>> {
    const monad = Promise.resultMonad<Error>();

    return Cat.doT(monad)
      .addM(
        'list',
        this.#listRepository
          .fetchList(listID)
          .then(
            Result.mapErr(
              (e) => new ListNotFoundError('List not found', { cause: e }),
            ),
          ),
      )
      .when(
        ({ list }) => !this.isAllowed(actorID, list),
        () =>
          Promise.resolve(
            Result.err(
              new TimelineInsufficientPermissionError(
                "Account don't have permission to remove member",
                { cause: null },
              ),
            ),
          ),
      )
      .runWith(() =>
        monad.map(() => [])(
          this.#listRepository.removeListMember(listID, accountID),
        ),
      )
      .runWith(({ list }) =>
        monad.map(() => [])(
          Promise.resolve(list.removeMember(accountID, actorID)),
        ),
      )
      .runWith(async ({ list }) => {
        await this.#eventPublisher.publishMany(list.pullEvents());
        return monad.pure([]);
      })
      .finish(() => undefined);
  }

  private isAllowed(actor: AccountID, list: List): boolean {
    return list.getOwnerId() === actor;
  }
}
export const removeListMemberSymbol =
  Ether.newEtherSymbol<RemoveListMemberService>();
export const removeListMember = Ether.newEther(
  removeListMemberSymbol,
  ({ listRepository, eventPublisher }) =>
    new RemoveListMemberService(listRepository, eventPublisher),
  {
    listRepository: listRepoSymbol,
    eventPublisher: eventPublisherSymbol,
  },
);
