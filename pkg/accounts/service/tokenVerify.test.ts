import { Result } from '@mikuroxina/mini-fn';
import { type ID } from '../../id/type.js';
import { InMemoryAccountVerifyTokenRepository } from '../adaptor/repository/dummy.js';
import { type AccountID } from '../model/account.js';
import { TokenVerifyService } from './tokenVerify.js';
import { assertEquals } from 'std/assert';
import { type Clock } from '../../id/mod.js';

const repository = new InMemoryAccountVerifyTokenRepository();
const service = new TokenVerifyService(repository);

Deno.test('generate/verify account verify token', async () => {
  const token = await service.generate('1' as ID<AccountID>);
  if (Result.isErr(token)) {
    return;
  }

  const verify = await service.verify('1' as ID<AccountID>, token[1]);
  if (Result.isErr(verify)) {
    return;
  }

  assertEquals(Result.isOk(token), true);
  assertEquals(Result.isOk(verify), true);
});

class DateClock implements Clock {
  Now(): bigint {
    return 0n;
  }
}

Deno.test('expired token', async () => {
  const dummyService = new TokenVerifyService(repository, new DateClock());
  const token = await dummyService.generate('1' as ID<AccountID>);
  if (Result.isErr(token)) {
    return;
  }
  const verify = await dummyService.verify('1' as ID<AccountID>, token[1]);

  assertEquals(Result.isOk(token), true);
  assertEquals(Result.isOk(verify), false);
});

Deno.test('invalid token', async () => {
  const token = await service.generate('1' as ID<AccountID>);
  const verify = await service.verify('1' as ID<AccountID>, 'abcde');

  assertEquals(Result.isOk(token), true);
  assertEquals(Result.isOk(verify), false);
});
