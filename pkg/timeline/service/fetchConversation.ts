import { Ether, type Result } from '@mikuroxina/mini-fn';
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

  async fetchConversation(
    accountID: AccountID,
  ): Promise<Result.Result<Error, ConversationRecipient[]>> {
    return await this.conversationRepository.findByAccountID(accountID);
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
