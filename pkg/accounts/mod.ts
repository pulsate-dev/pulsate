import { OpenAPIHono } from '@hono/zod-openapi';
import { Cat, Ether, Promise, Result } from '@mikuroxina/mini-fn';

import { clockSymbol, snowflakeIDGenerator } from '../id/mod.js';
import { argon2idPasswordEncoder } from '../password/mod.js';
import { AccountController } from './adaptor/controller/account.js';
import {
  newFollowRepo,
  newAccountRepo,
  verifyTokenRepo,
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
import { authenticate } from './service/authenticate.js';
import { authenticateToken } from './service/authenticationTokenService.js';
import { edit } from './service/edit.js';
import { etag } from './service/etagService.js';
import { fetch } from './service/fetch.js';
import { follow } from './service/follow.js';
import { freeze } from './service/freeze.js';
import { register } from './service/register.js';
import { resendToken } from './service/resendToken.js';
import { dummy } from './service/sendNotification.js';
import { silence } from './service/silence.js';
import { unfollow } from './service/unfollow.js';
import { verifyAccountToken } from './service/verifyToken.js';

export const accounts = new OpenAPIHono();
const accountRepository = newAccountRepo();
const accountFollowRepository = newFollowRepo();
class Clock {
  now() {
    return BigInt(Date.now());
  }
}
const clock = Ether.newEther(clockSymbol, () => new Clock());
const idGenerator = Ether.compose(clock)(snowflakeIDGenerator(0));

const verifyAccountTokenService = Cat.cat(verifyAccountToken)
  .feed(Ether.compose(clock))
  .feed(Ether.compose(verifyTokenRepo))
  .feed(Ether.compose(accountRepository)).value;

const composer = Ether.composeT(Promise.monad);
const liftOverPromise = <const D extends Record<string, symbol>, T>(
  ether: Ether.Ether<D, T>,
): Ether.EtherT<D, Promise.PromiseHkt, T> => ({
  ...ether,
  handler: (resolved) => Promise.pure(ether.handler(resolved)),
});
export const controller = new AccountController({
  authenticateService: await Ether.runEtherT(
    Cat.cat(liftOverPromise(authenticate))
      .feed(composer(liftOverPromise(accountRepository)))
      .feed(composer(authenticateToken))
      .feed(composer(liftOverPromise(argon2idPasswordEncoder))).value,
  ),
  editService: Ether.runEther(
    Cat.cat(edit)
      .feed(Ether.compose(accountRepository))
      .feed(Ether.compose(etag))
      .feed(Ether.compose(argon2idPasswordEncoder)).value,
  ),
  fetchService: Ether.runEther(
    Cat.cat(fetch).feed(Ether.compose(accountRepository)).value,
  ),
  followService: Ether.runEther(
    Cat.cat(follow)
      .feed(Ether.compose(accountRepository))
      .feed(Ether.compose(accountFollowRepository)).value,
  ),
  freezeService: Ether.runEther(
    Cat.cat(freeze).feed(Ether.compose(accountRepository)).value,
  ),
  registerAccountService: Ether.runEther(
    Cat.cat(register)
      .feed(Ether.compose(accountRepository))
      .feed(Ether.compose(idGenerator))
      .feed(Ether.compose(argon2idPasswordEncoder))
      .feed(Ether.compose(dummy))
      .feed(Ether.compose(verifyAccountTokenService)).value,
  ),
  silenceService: Ether.runEther(
    Cat.cat(silence).feed(Ether.compose(accountRepository)).value,
  ),
  verifyAccountTokenService: Ether.runEther(verifyAccountTokenService),
  unFollowService: Ether.runEther(
    Cat.cat(unfollow)
      .feed(Ether.compose(accountFollowRepository))
      .feed(Ether.compose(accountRepository)).value,
  ),
  resendTokenService: Ether.runEther(
    Cat.cat(resendToken)
      .feed(Ether.compose(accountRepository))
      .feed(Ether.compose(verifyAccountTokenService))
      .feed(Ether.compose(dummy)).value,
  ),
});

accounts.doc('/accounts/doc.json', {
  openapi: '3.0.0',
  info: {
    title: 'Accounts API',
    version: '0.1.0',
  },
});

export type AccountModuleHandlerType = typeof GetAccountHandler;

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

const GetAccountHandler = accounts.openapi(GetAccountRoute, async (c) => {
  const id = c.req.param('id');

  const res = await controller.getAccount(id);
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
