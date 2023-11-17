import { EtagVerifyService } from './etag_verify_generate_service.ts';
import { ID } from '../../id/type.ts';
import { Account, AccountID, CreateAccountArgs } from '../model/account.ts';
import { assertEquals } from 'std/assert';

const service: EtagVerifyService = new EtagVerifyService();

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

Deno.test('should return string which is 64 characters long', async () => {
  const etag = await service.generate(Account.new(accountArgs));
  assertEquals(etag.length, 64);
});
