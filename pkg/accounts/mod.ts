import { OpenAPIHono } from '@hono/zod-openapi';
import { Result } from '@mikuroxina/mini-fn';

import { SnowflakeIDGenerator } from '../id/mod.js';
import { Argon2idPasswordEncoder } from '../password/mod.js';
import { AccountController } from './adaptor/controller/account.js';
import {
  InMemoryAccountFollowRepository,
  InMemoryAccountRepository,
  InMemoryAccountVerifyTokenRepository,
} from './adaptor/repository/dummy.js';
import type { AccountName } from './model/account.js';
import {
  CreateAccountRoute,
  FollowAccountRoute,
  FreezeAccountRoute,
  GetAccountRoute,
  LoginRoute,
  RefreshRoute,
  ResendVerificationEmailRoute,
  SilenceAccountRoute,
  UnFollowAccountRoute,
  UnFreezeAccountRoute,
  UnSilenceAccountRoute,
  UpdateAccountRoute,
  VerifyEmailRoute,
} from './router.js';
import { TokenVerifyService } from './service/accountVerifyToken.js';
import { AuthenticationService } from './service/authenticate.js';
import { EditAccountService } from './service/editAccount.js';
import { EtagVerifyService } from './service/etagGenerateVerify.js';
import { FetchAccountService } from './service/fetchAccount.js';
import { FollowService } from './service/followAccount.js';
import { FreezeService } from './service/freezeAccount.js';
import { RegisterAccountService } from './service/registerAccount.js';
import { ResendVerifyTokenService } from './service/resendAccountVerifyToken.js';
import { DummySendNotificationService } from './service/sendNotification.js';
import { SilenceService } from './service/silenceAccount.js';
import { TokenGenerator } from './service/tokenGenerator.js';
import { UnfollowService } from './service/unfollowAccount.js';

export const accounts = new OpenAPIHono();
const accountRepository = new InMemoryAccountRepository();
const accountFollowRepository = new InMemoryAccountFollowRepository();
const accountVerifyTokenRepository = new InMemoryAccountVerifyTokenRepository();
const tokenGenerator = await TokenGenerator.new();
class Clock {
  now() {
    return BigInt(Date.now());
  }
}
const idGenerator = new SnowflakeIDGenerator(0, new Clock());
const passwordEncoder = new Argon2idPasswordEncoder();

export const controller = new AccountController({
  authenticationService: new AuthenticationService({
    accountRepository: accountRepository,
    tokenGenerator: tokenGenerator,
    passwordEncoder: passwordEncoder,
  }),
  editAccountService: new EditAccountService(
    accountRepository,
    new EtagVerifyService(),
    passwordEncoder,
  ),
  fetchAccountService: new FetchAccountService(accountRepository),
  followService: new FollowService(accountFollowRepository, accountRepository),
  freezeService: new FreezeService(accountRepository),
  registerAccountService: new RegisterAccountService({
    repository: accountRepository,
    idGenerator: idGenerator,
    passwordEncoder: passwordEncoder,
    sendNotification: new DummySendNotificationService(),
    verifyTokenService: new TokenVerifyService(
      accountVerifyTokenRepository,
      accountRepository,
      new Clock(),
    ),
  }),
  silenceService: new SilenceService(accountRepository),
  tokenVerifyService: new TokenVerifyService(
    accountVerifyTokenRepository,
    accountRepository,
    new Clock(),
  ),
  unFollowService: new UnfollowService(
    accountFollowRepository,
    accountRepository,
  ),
  resendTokenService: new ResendVerifyTokenService(
    accountRepository,
    new TokenVerifyService(
      accountVerifyTokenRepository,
      accountRepository,
      new Clock(),
    ),
    new DummySendNotificationService(),
  ),
});

accounts.doc('/accounts/doc.json', {
  openapi: '3.0.0',
  info: {
    title: 'Accounts API',
    version: '0.1.0',
  },
});

accounts.openapi(CreateAccountRoute, async (c) => {
  const { name, email, passphrase } = c.req.valid('json');

  const res = await controller.createAccount(name, email, passphrase);
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, { status: 400 });
  }

  return c.json(res[1]);
});

accounts.openapi(UpdateAccountRoute, async (c) => {
  const name = c.req.param('name');
  const { email, passphrase, bio, nickname } = c.req.valid('json');
  const eTag = c.req.header('If-Match');

  if (!eTag) {
    return c.json({ error: 'INVALID_ETAG' }, { status: 412 });
  }

  const res = await controller.updateAccount(
    name,
    {
      email: email,
      passphrase: passphrase,
      bio: bio,
      nickname: nickname,
    },
    eTag,
  );
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, { status: 400 });
  }

  return c.json(res[1]);
});

accounts.openapi(FreezeAccountRoute, async (c) => {
  const name = c.req.param('name');

  const res = await controller.freezeAccount(name);
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, { status: 400 });
  }

  return new Response(null, { status: 204 });
});

accounts.openapi(UnFreezeAccountRoute, async (c) => {
  const name = c.req.param('name');

  const res = await controller.unFreezeAccount(name);
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, { status: 400 });
  }

  return new Response(null, { status: 204 });
});

accounts.openapi(VerifyEmailRoute, async (c) => {
  const name = c.req.param('name');
  const { token } = c.req.valid('json');

  const res = await controller.verifyEmail(name, token);
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, { status: 400 });
  }

  return new Response(null, { status: 204 });
});

accounts.openapi(GetAccountRoute, async (c) => {
  const name = c.req.param('name');

  const res = await controller.getAccount(name);
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, { status: 404 });
  }

  return c.json({
    id: res[1].id,
    name: res[1].name,
    nickname: res[1].nickname,
    bio: res[1].bio,
    avatar: '',
    header: '',
    followed_count: res[1].followed_count,
    following_count: res[1].following_count,
    note_count: res[1].note_count,
  });
});

accounts.openapi(LoginRoute, async (c) => {
  const { name, passphrase } = c.req.valid('json');

  const res = await controller.login(name as AccountName, passphrase);
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, { status: 400 });
  }

  return c.json(res[1]);
});

accounts.openapi(RefreshRoute, () => {
  throw new Error('Not implemented');
});

accounts.openapi(SilenceAccountRoute, async (c) => {
  const name = c.req.param('name');
  const res = await controller.silenceAccount(name);
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, { status: 400 });
  }

  return new Response(null, { status: 204 });
});

accounts.openapi(UnSilenceAccountRoute, async (c) => {
  const name = c.req.param('name');
  const res = await controller.unSilenceAccount(name);
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, { status: 400 });
  }

  return new Response(null, { status: 204 });
});

accounts.openapi(FollowAccountRoute, async (c) => {
  const name = c.req.param('name');

  const res = await controller.followAccount(name);
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, { status: 400 });
  }

  return c.json({});
});

accounts.openapi(ResendVerificationEmailRoute, async (c) => {
  const name = c.req.param('name');

  const res = await controller.resendVerificationEmail(name);
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, { status: 400 });
  }

  return new Response(null, { status: 204 });
});

accounts.openapi(UnFollowAccountRoute, async (c) => {
  const name = c.req.param('name');

  const res = await controller.unFollowAccount(name);
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, { status: 400 });
  }

  return new Response(null, { status: 204 });
});
