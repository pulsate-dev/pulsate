import { Ether, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import {
  type ConversationRecipient,
  type ConversationRepository,
  conversationRepoSymbol,
} from '../model/repository.js';

export class FetchConversationService {
  constructor(
    private readonly conversationRepository: ConversationRepository,
  ) {}

  /**
   * @returns {@link ConversationRecipient} - The list of conversation recipients.
   * NOTE:
   * - return value is sorted by the {@link ConversationRecipient.lastSentAt} property (latest -> oldest).
   * - if an account never sent/received direct notes, the return value is an empty array.
   **/
  async fetchConversation(
    accountID: AccountID,
  ): Promise<Result.Result<Error, ConversationRecipient[]>> {
    const res = await this.conversationRepository.findByAccountID(accountID);
    if (Result.isErr(res)) return res;

    return Result.ok(
      Result.unwrap(res).toSorted(
        (a, b) => b.lastSentAt.getTime() - a.lastSentAt.getTime(),
      ),
    );
  }
}
export const fetchConversationServiceSymbol =
  Ether.newEtherSymbol<FetchConversationService>();
export const fetchConversation = Ether.newEther(
  fetchConversationServiceSymbol,
  ({ conversationRepository }) =>
    new FetchConversationService(conversationRepository),
  {
    conversationRepository: conversationRepoSymbol,
  },
);
