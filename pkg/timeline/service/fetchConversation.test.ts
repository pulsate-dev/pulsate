import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import { InMemoryConversationRepository } from '../adaptor/repository/dummy.js';
import { FetchConversationService } from './fetchConversation.js';

describe('FetchConversationService', () => {
  const repo = new InMemoryConversationRepository(
    new Map<AccountID, AccountID[]>([
      ['1', ['2', '3']] as [AccountID, AccountID[]],
      ['2', ['1']] as [AccountID, AccountID[]],
    ]),
  );
  const service = new FetchConversationService(repo);

  it('should fetch conversations', async () => {
    const result = await service.fetchConversation('1' as AccountID);

    expect(Result.isOk(result)).toBe(true);
    expect(result[1]).toStrictEqual(['2', '3']);
  });
});
