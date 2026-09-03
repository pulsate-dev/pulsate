import { Cat, Ether, Promise, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.ts';
import {
  type Clock,
  clockSymbol,
  type SnowflakeIDGenerator,
  snowflakeIDGeneratorSymbol,
} from '../../internal/id/mod.ts';
import {
  ListNotFoundError,
  TimelineInsufficientPermissionError,
} from '../model/errors.ts';
import type { List, ListID } from '../model/list.ts';
import { type ListRepository, listRepoSymbol } from '../model/repository.ts';

export class AppendListMemberService {
  readonly #listRepository: ListRepository;
  readonly #idGenerator: SnowflakeIDGenerator;
  readonly #clock: Clock;
  constructor(
    listRepository: ListRepository,
    idGenerator: SnowflakeIDGenerator,
    clock: Clock,
  ) {
    this.#listRepository = listRepository;
    this.#idGenerator = idGenerator;
    this.#clock = clock;
  }

  /**
   * @description Append member to list.
   * NOTE: If account is already a member, returns error.
   * NOTE: If list member count exceeds limit(250, static), returns error.
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
                "Account don't have permission to do this action",
                { cause: null },
              ),
            ),
          ),
      )
      .runWith(({ list }) =>
        monad.map(() => [])(
          Promise.resolve(
            list.addMember(accountID, {
              idGenerator: this.#idGenerator,
              actor: actorID,
              occurredAt: new Date(Number(this.#clock.now())),
            }),
          ),
        ),
      )
      .runWith(({ list }) =>
        monad.map(() => [])(this.#listRepository.appendListMember(list)),
      )
      .finish(() => undefined);
  }

  private isAllowed(actor: AccountID, list: List): boolean {
    return list.getOwnerId() === actor;
  }
}
export const appendListMemberSymbol =
  Ether.newEtherSymbol<AppendListMemberService>();
export const appendListMember = Ether.newEther(
  appendListMemberSymbol,
  ({ listRepository, idGenerator, clock }) =>
    new AppendListMemberService(listRepository, idGenerator, clock),
  {
    listRepository: listRepoSymbol,
    idGenerator: snowflakeIDGeneratorSymbol,
    clock: clockSymbol,
  },
);
