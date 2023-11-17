import { InMemoryAccountRepository } from '../adaptor/repository/dummy.ts';
import { AccountRepository } from '../model/repository.ts';
import { EtagService } from './etag_generate_service.ts';
import { ID } from '../../id/type.ts';
import { Account, AccountID, CreateAccountArgs } from '../model/account.ts';
import { assertEquals } from 'std/assert';
import { Result } from 'mini-fn';

const repository: AccountRepository = new InMemoryAccountRepository();
const service: EtagService = new EtagService(repository);

const accountArgs: CreateAccountArgs = {
  id: '1' as ID<AccountID>,
  bio: 'this is john doe\'s account!',
  createdAt: new Date('2023-09-10T00:00:00.000Z'),
  mail: 'test@mail.example.com',
  nickname: 'John Doe',
  passphraseHash: 'leknflkwnrigohidvlk',
  role: 'admin',
  status: 'active',
  frozen: 'frozen',
  silenced: 'silenced',
  name: 'johndoe@social.example.com',
  updatedAt: new Date('2023-09-10T09:00:00.000Z'),
  deletedAt: new Date('2023-09-10T10:00:00.000Z'),
};

Deno.test('should return true', async () => {
  const account = Account.new(accountArgs);
  await repository.create(account);

  const etag = await service.generate(account);
  const result = await service.compare(account.getName, etag);
  assertEquals(Result.isErr(result), false);
  assertEquals(result[1], true);
});

Deno.test('should return false', async () => {
  const account = Account.new(accountArgs);
  await repository.create(account);

  const etag = await service.generate(account) + '_dummy';
  const result = await service.compare(account.getName, etag);
  assertEquals(Result.isErr(result), false);
  assertEquals(result[1], false);
});

Deno.test('should return error which account not found', async () => {
  const result = await service.compare('dummy_etag', 'dummy');
  assertEquals(Result.isErr(result), true);
  assertEquals(Result.isOk(result), false);
});
