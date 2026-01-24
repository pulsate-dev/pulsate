import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import type { Note, NoteID } from '../../notes/model/note.js';
import {
  type ConversationCursor,
  type ConversationRecipient,
  type ConversationRepository,
  conversationRepoSymbol,
  type FetchConversationNotesFilter,
} from '../model/repository.js';

export interface FetchConversationNotesArgs {
  limit: Option.Option<number>;
  /**
   * @description Retrieved from notes before this ID
   */
  beforeID: Option.Option<NoteID>;
  /**
   * @description Retrieved from notes after this ID
   */
  afterID: Option.Option<NoteID>;
}

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

  /**
   * @description Fetch conversation notes between two accounts
   * @param accountID The account ID of the current user
   * @param recipientID The account ID of the conversation partner
   * @param args Optional filter arguments for pagination
   * @returns Array of direct notes in the conversation
   */
  async fetchConversationNotes(
    accountID: AccountID,
    recipientID: AccountID,
    args: FetchConversationNotesArgs = {
      limit: Option.none(),
      beforeID: Option.none(),
      afterId: Option.none(),
    },
  ): Promise<Result.Result<Error, Note[]>> {
    if (Option.isSome(args.beforeID) && Option.isSome(args.afterID)) {
      return Result.err(
        new Error('beforeID and afterID cannot be specified at the same time'),
      );
    }

    const limit = Option.unwrapOr(20)(args.limit);

    const cursor: Option.Option<ConversationCursor> = Option.isSome(
      args.beforeID,
    )
      ? Option.some({
          type: 'before',
          id: Option.unwrap(args.beforeID),
        })
      : Option.isSome(args.afterID)
        ? Option.some({
            type: 'after',
            id: Option.unwrap(args.afterID),
          })
        : Option.none();

    const filter: FetchConversationNotesFilter = {
      limit,
      cursor: Option.isSome(cursor) ? Option.unwrap(cursor) : undefined,
    };

    return await this.conversationRepository.fetchConversationNotes(
      accountID,
      recipientID,
      filter,
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
