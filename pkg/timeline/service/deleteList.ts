import { Ether, Result } from '@mikuroxina/mini-fn';
import {
  type EventPublisher,
  eventPublisherSymbol,
} from '../../internal/event/mod.ts';
import type { ID } from '../../internal/id/type.ts';
import type { List } from '../model/list.ts';
import { type ListRepository, listRepoSymbol } from '../model/repository.ts';

export class DeleteListService {
  readonly #listRepository: ListRepository;
  readonly #eventPublisher: EventPublisher;
  constructor(listRepository: ListRepository, eventPublisher: EventPublisher) {
    this.#listRepository = listRepository;
    this.#eventPublisher = eventPublisher;
  }

  async handle(listId: ID<List>): Promise<Result.Result<Error, void>> {
    const listRes = await this.#listRepository.fetchList(listId);
    if (Result.isErr(listRes)) {
      return listRes;
    }

    const res = await this.#listRepository.deleteById(listId);

    if (Result.isErr(res)) {
      return res;
    }

    const list = Result.unwrap(listRes);
    list.deleted();
    await this.#eventPublisher.publishMany(list.pullEvents());

    return Result.ok(undefined);
  }
}
export const deleteListSymbol = Ether.newEtherSymbol<DeleteListService>();
export const deleteList = Ether.newEther(
  deleteListSymbol,
  ({ listRepository, eventPublisher }) =>
    new DeleteListService(listRepository, eventPublisher),
  {
    listRepository: listRepoSymbol,
    eventPublisher: eventPublisherSymbol,
  },
);
