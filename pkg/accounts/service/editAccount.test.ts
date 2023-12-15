import {
  InMemoryAccountRepository,
  InMemoryAccountVerifyTokenRepository,
} from '../adaptor/repository/dummy.ts';
import { Clock, SnowflakeIDGenerator } from '../../id/mod.ts';
import { ScryptPasswordEncoder } from '../../password/mod.ts';
import { RegisterAccountService } from './register.ts';
import { DummySendNotificationService } from './sendNotification.ts';
import { TokenVerifyService } from './tokenVerify.ts';
import { EtagVerifyService } from './etagGenerateVerify.ts';
import { EditAccountService } from './editAccount.ts';

import { AccountRole } from '../model/account.ts';
import { Result } from 'mini-fn';
import { assertEquals } from 'std/assert';

const repository = new InMemoryAccountRepository();
const verifyRepository = new InMemoryAccountVerifyTokenRepository();
class DummyClock implements Clock {
  Now(): bigint {
    return BigInt(new Date('2023/9/10 00:00:00 UTC').getTime());
  }
}
const registerService: RegisterAccountService = new RegisterAccountService({
  repository,
  idGenerator: new SnowflakeIDGenerator(1, new DummyClock()),
  passwordEncoder: new ScryptPasswordEncoder(),
  sendNotification: new DummySendNotificationService(),
  verifyTokenService: new TokenVerifyService(verifyRepository),
});
const etagVerifyService = new EtagVerifyService();
const editAccountService = new EditAccountService(
  repository,
  etagVerifyService,
  new ScryptPasswordEncoder(),
);

const exampleInput = {
  name: 'john_doe@example.com',
  mail: 'johndoe@example.com',
  nickname: 'John Doe',
  passphrase: 'password',
  bio: 'Hello, World!',
  role: 'normal' as AccountRole,
};

Deno.test('should be success to update nickname', async () => {
  const res = await registerService.handle(
    exampleInput.name,
    exampleInput.mail,
    exampleInput.nickname,
    exampleInput.passphrase,
    exampleInput.bio,
    exampleInput.role,
  );
  const account = Result.unwrap(res);
  const etag = await etagVerifyService.generate(account);
  const updateRes = await editAccountService.editNickname(
    etag,
    exampleInput.name,
    'new nickname',
  );
  assertEquals(Result.isErr(updateRes), false);
  assertEquals(updateRes[1], true);
  assertEquals(account.getNickname, 'new nickname');
  repository.reset();
});

Deno.test(
  'should be fail to update nickname when nickname shorter more than 1',
  async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role,
    );
    const account = Result.unwrap(res);
    assertEquals(Result.isErr(res), false);

    const etag = await etagVerifyService.generate(account);
    const updateRes = await editAccountService.editNickname(
      etag,
      exampleInput.name,
      '',
    );
    assertEquals(Result.isErr(updateRes), true);
    repository.reset();
  },
);

Deno.test(
  'should be fail to update nickname when nickname more than 256',
  async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role,
    );
    const account = Result.unwrap(res);
    assertEquals(Result.isErr(res), false);

    const etag = await etagVerifyService.generate(account);
    const updateRes = await editAccountService.editNickname(
      etag,
      exampleInput.name,
      'a'.repeat(257),
    );
    assertEquals(Result.isErr(updateRes), true);
    repository.reset();
  },
);

Deno.test('should be success to update nickname when nickname 256', async () => {
  const res = await registerService.handle(
    exampleInput.name,
    exampleInput.mail,
    exampleInput.nickname,
    exampleInput.passphrase,
    exampleInput.bio,
    exampleInput.role,
  );
  const account = Result.unwrap(res);
  assertEquals(Result.isErr(res), false);

  const etag = await etagVerifyService.generate(account);
  const updateRes = await editAccountService.editNickname(
    etag,
    exampleInput.name,
    'a'.repeat(256),
  );
  assertEquals(Result.isErr(updateRes), false);
  assertEquals(updateRes[1], true);
  assertEquals(account.getNickname, 'a'.repeat(256));
  repository.reset();
});

Deno.test(
  'should be success to update nickname when nickname 1',
  async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role,
    );
    const account = Result.unwrap(res);
    assertEquals(Result.isErr(res), false);

    const etag = await etagVerifyService.generate(account);
    const updateRes = await editAccountService.editNickname(
      etag,
      exampleInput.name,
      'a',
    );
    assertEquals(Result.isErr(updateRes), false);
    assertEquals(updateRes[1], true);
    repository.reset();
  },
);

Deno.test('should be fail to update nickname when etag not match', async () => {
  await registerService.handle(
    exampleInput.name,
    exampleInput.mail,
    exampleInput.nickname,
    exampleInput.passphrase,
    exampleInput.bio,
    exampleInput.role,
  );

  const res = await editAccountService.editNickname(
    'invalid_etag',
    exampleInput.name,
    'new nickname',
  );
  assertEquals(Result.isErr(res), true);
  repository.reset();
});

Deno.test(
  'should be fail to update nickname when account not found',
  async () => {
    const res = await editAccountService.editNickname(
      'invalid etag',
      'foo',
      'new nickname',
    );
    assertEquals(Result.isErr(res), true);
    repository.reset();
  },
);

Deno.test('should be success to update passphrase', async () => {
  const res = await registerService.handle(
    exampleInput.name,
    exampleInput.mail,
    exampleInput.nickname,
    exampleInput.passphrase,
    exampleInput.bio,
    exampleInput.role,
  );
  const account = Result.unwrap(res);
  const etag = await etagVerifyService.generate(account);

  const updateRes = await editAccountService.editPassphrase(
    etag,
    exampleInput.name,
    'new password',
  );
  assertEquals(Result.isErr(updateRes), false);
  assertEquals(updateRes[1], true);
  repository.reset();
});

Deno.test('should be fail to update passphrase when passphrase shorter more than 8', async () => {
  const res = await registerService.handle(
    exampleInput.name,
    exampleInput.mail,
    exampleInput.nickname,
    exampleInput.passphrase,
    exampleInput.bio,
    exampleInput.role,
  );
  const account = Result.unwrap(res);
  assertEquals(Result.isErr(res), false);

  const etag = await etagVerifyService.generate(account);

  const updateRes = await editAccountService.editPassphrase(
    etag,
    exampleInput.name,
    'a'.repeat(7),
  );
  assertEquals(Result.isErr(updateRes), true);
  repository.reset();
});
Deno.test(
  'should be fail to update passphrase when passphrase longer more than 512',
  async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role,
    );
    const account = Result.unwrap(res);
    assertEquals(Result.isErr(res), false);

    const etag = await etagVerifyService.generate(account);

    const updateRes = await editAccountService.editPassphrase(
      etag,
      exampleInput.name,
      'a'.repeat(513),
    );
    assertEquals(Result.isErr(updateRes), true);
    repository.reset();
  },
);
Deno.test('should be success to update passphrase when passphrase 8', async () => {
  const res = await registerService.handle(
    exampleInput.name,
    exampleInput.mail,
    exampleInput.nickname,
    exampleInput.passphrase,
    exampleInput.bio,
    exampleInput.role,
  );
  const account = Result.unwrap(res);
  assertEquals(Result.isErr(res), false);

  const etag = await etagVerifyService.generate(account);

  const updateRes = await editAccountService.editPassphrase(
    etag,
    exampleInput.name,
    'a'.repeat(8),
  );
  assertEquals(Result.isErr(updateRes), false);
  assertEquals(updateRes[1], true);
  repository.reset();
});
Deno.test(
  'should be success to update passphrase when passphrase 512',
  async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role,
    );
    const account = Result.unwrap(res);
    assertEquals(Result.isErr(res), false);

    const etag = await etagVerifyService.generate(account);

    const updateRes = await editAccountService.editPassphrase(
      etag,
      exampleInput.name,
      'a'.repeat(512),
    );
    assertEquals(Result.isErr(updateRes), false);
    assertEquals(updateRes[1], true);
    repository.reset();
  },
);

Deno.test(
  'should be fail to update passphrase when etag not match',
  async () => {
    await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role,
    );

    const res = await editAccountService.editPassphrase(
      'invalid_etag',
      exampleInput.name,
      'new password',
    );
    assertEquals(Result.isErr(res), true);
    repository.reset();
  },
);

Deno.test(
  'should be fail to update passphrase when account not found',
  async () => {
    const res = await editAccountService.editPassphrase(
      'invalid etag',
      'foo',
      'new password',
    );
    assertEquals(Result.isErr(res), true);
    repository.reset();
  },
);

Deno.test('should be success to update email', async () => {
  const res = await registerService.handle(
    exampleInput.name,
    exampleInput.mail,
    exampleInput.nickname,
    exampleInput.passphrase,
    exampleInput.bio,
    exampleInput.role,
  );
  const account = Result.unwrap(res);
  const etag = await etagVerifyService.generate(account);

  const updateRes = await editAccountService.editEmail(
    etag,
    exampleInput.name,
    'pulsate@example.com',
  );
  assertEquals(Result.isErr(updateRes), false);
  assertEquals(updateRes[1], true);
  repository.reset();
});

Deno.test('should be fail to update email when etag not match', async () => {
  const res = await registerService.handle(
    exampleInput.name,
    exampleInput.mail,
    exampleInput.nickname,
    exampleInput.passphrase,
    exampleInput.bio,
    exampleInput.role,
  );
  Result.unwrap(res);

  const updateRes = await editAccountService.editEmail(
    'invalid_etag',
    exampleInput.name,
    'pulsate@example.com',
  );
  assertEquals(Result.isErr(updateRes), true);
  repository.reset();
});

Deno.test('should be fail to update email when account not found', async () => {
  const updateRes = await editAccountService.editEmail(
    'invalid etag',
    'foo',
    'pulsate@pulsate.mail',
  );
  assertEquals(Result.isErr(updateRes), true);
});

Deno.test('should be success to update email when email shortest', async () => {
  const res = await registerService.handle(
    exampleInput.name,
    exampleInput.mail,
    exampleInput.nickname,
    exampleInput.passphrase,
    exampleInput.bio,
    exampleInput.role,
  );
  const account = Result.unwrap(res);
  assertEquals(Result.isErr(res), false);
  const etag = await etagVerifyService.generate(account);

  const updateRes = await editAccountService.editEmail(
    etag,
    exampleInput.name,
    'a'.repeat(7),
  );
  assertEquals(Result.isErr(updateRes), false);
  assertEquals(updateRes[1], true);
  repository.reset();
});

Deno.test('should be success to update email when email length 8', async () => {
  const res = await registerService.handle(
    exampleInput.name,
    exampleInput.mail,
    exampleInput.nickname,
    exampleInput.passphrase,
    exampleInput.bio,
    exampleInput.role,
  );
  const account = Result.unwrap(res);
  assertEquals(Result.isErr(res), false);
  const etag = await etagVerifyService.generate(account);

  const updateRes = await editAccountService.editEmail(
    etag,
    exampleInput.name,
    'a'.repeat(8),
  );
  assertEquals(Result.isErr(updateRes), false);
  assertEquals(updateRes[1], true);
  repository.reset();
});

Deno.test('should be fail to update email when email too long', async () => {
  const res = await registerService.handle(
    exampleInput.name,
    exampleInput.mail,
    exampleInput.nickname,
    exampleInput.passphrase,
    exampleInput.bio,
    exampleInput.role,
  );
  const account = Result.unwrap(res);
  assertEquals(Result.isErr(res), false);
  const etag = await etagVerifyService.generate(account);

  const updateRes = await editAccountService.editEmail(
    etag,
    exampleInput.name,
    'a'.repeat(320),
  );
  assertEquals(Result.isErr(updateRes), true);
  repository.reset();
});

Deno.test(
  'should be success to update email when email length 319',
  async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role,
    );
    const account = Result.unwrap(res);
    assertEquals(Result.isErr(res), false);
    const etag = await etagVerifyService.generate(account);

    const updateRes = await editAccountService.editEmail(
      etag,
      exampleInput.name,
      'a'.repeat(319),
    );
    assertEquals(Result.isErr(updateRes), false);
    assertEquals(updateRes[1], true);
    repository.reset();
  },
);
