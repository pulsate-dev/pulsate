import { OpenAPIHono } from '@hono/zod-openapi';
import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import {
  AuthenticateMiddlewareService,
  type AuthMiddlewareVariable,
} from '../../adaptors/authenticateMiddleware.ts';
import { newTurnstileCaptchaValidator } from '../adaptor/captcha/turnstile.ts';
import { accountModuleLogger } from '../adaptor/logger.ts';
import { captchaMiddleware } from '../adaptor/middileware/captcha.ts';
import { controller } from '../deps.ts';
import {
  AccountAlreadyFrozenError,
  AccountCaptchaTokenInvalidError,
  AccountInsufficientPermissionError,
  AccountMailAddressAlreadyInUseError,
  AccountMailAddressAlreadyVerifiedError,
  AccountMailAddressLengthError,
  AccountMailAddressVerificationTokenInvalidError,
  AccountNameAlreadyInUseError,
  AccountNameInvalidUsageError,
  AccountNameTooLongError,
  AccountNotFoundError,
  AccountPassphraseRequirementsNotMetError,
} from '../model/errors.ts';
import {
  CreateAccountRoute,
  FreezeAccountRoute,
  GetAccountFollowerRoute,
  GetAccountFollowingRoute,
  GetAccountRelationshipsRoute,
  GetAccountRoute,
  ResendVerificationEmailRoute,
  UnFreezeAccountRoute,
  UpdateAccountRoute,
  VerifyEmailRoute,
} from '../router.ts';

const AuthMiddleware = new AuthenticateMiddlewareService();
const CaptchaMiddleware = Ether.runEther(
  Ether.compose(
    newTurnstileCaptchaValidator(process.env.TURNSTILE_SECRET ?? ''),
  )(captchaMiddleware),
);

export const accountHandlers = new OpenAPIHono<{
  Variables: AuthMiddlewareVariable;
}>();

accountHandlers.post('/accounts', CaptchaMiddleware.handle());

accountHandlers.openapi(CreateAccountRoute, async (c) => {
  const { name, email, passphrase } = c.req.valid('json');

  const res = await controller.createAccount(name, email, passphrase);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    accountModuleLogger.warn(error);
    if (error instanceof AccountNameInvalidUsageError) {
      return c.json({ error: 'INVALID_ACCOUNT_NAME' as const }, 400);
    }
    if (error instanceof AccountNameTooLongError) {
      return c.json({ error: 'TOO_LONG_ACCOUNT_NAME' as const }, 400);
    }
    if (error instanceof AccountCaptchaTokenInvalidError) {
      return c.json({ error: 'YOU_ARE_BOT' as const }, 400);
    }
    if (error instanceof AccountMailAddressAlreadyInUseError) {
      return c.json({ error: 'EMAIL_IN_USE' as const }, 409);
    }
    if (error instanceof AccountNameAlreadyInUseError) {
      return c.json({ error: 'ACCOUNT_NAME_IN_USE' as const }, 409);
    }
    accountModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(res[1], 200);
});

accountHandlers[UpdateAccountRoute.method](
  UpdateAccountRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);

accountHandlers.openapi(UpdateAccountRoute, async (c) => {
  const actorName = Option.unwrap(c.get('accountName'));
  const name = c.req.param('name');
  const { email, passphrase, bio, nickname } = c.req.valid('json');

  const res = await controller.updateAccount(
    name,
    {
      email: email,
      passphrase: passphrase,
      bio: bio,
      nickname: nickname,
    },
    actorName,
  );
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    accountModuleLogger.warn(error);
    if (error instanceof AccountMailAddressLengthError) {
      return c.json({ error: 'INVALID_SEQUENCE' as const }, 400);
    }
    if (error instanceof AccountPassphraseRequirementsNotMetError) {
      return c.json({ error: 'VULNERABLE_PASSPHRASE' as const }, 400);
    }
    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    accountModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(res[1], 200);
});

accountHandlers[FreezeAccountRoute.method](
  FreezeAccountRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);

accountHandlers.openapi(FreezeAccountRoute, async (c) => {
  const targetName = c.req.param('name');
  const actor = Option.unwrap(c.get('accountName'));

  const res = await controller.freezeAccount(targetName, actor);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    accountModuleLogger.warn(error);
    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    if (error instanceof AccountAlreadyFrozenError) {
      return c.json({ error: 'ALREADY_FROZEN' as const }, 400);
    }
    if (error instanceof AccountInsufficientPermissionError) {
      return c.json({ error: 'NO_PERMISSION' as const }, 403);
    }

    accountModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return new Response(null, { status: 204 });
});

accountHandlers[UnFreezeAccountRoute.method](
  UnFreezeAccountRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);

accountHandlers.openapi(UnFreezeAccountRoute, async (c) => {
  const targetName = c.req.param('name');
  const actor = Option.unwrap(c.get('accountName'));

  const res = await controller.unFreezeAccount(targetName, actor);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    accountModuleLogger.warn(error);
    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    if (error instanceof AccountInsufficientPermissionError) {
      return c.json({ error: 'NO_PERMISSION' as const }, 403);
    }

    accountModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return new Response(null, { status: 204 });
});

accountHandlers.openapi(VerifyEmailRoute, async (c) => {
  const name = c.req.param('name');
  const { token } = c.req.valid('json');

  const res = await controller.verifyEmail(name, token);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    accountModuleLogger.warn(error);
    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    if (error instanceof AccountMailAddressVerificationTokenInvalidError) {
      return c.json({ error: 'INVALID_TOKEN' as const }, 400);
    }

    accountModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return new Response(null, { status: 204 });
});

accountHandlers[GetAccountRoute.method](
  GetAccountRoute.path,
  AuthMiddleware.handle({ forceAuthorized: false }),
);

accountHandlers.openapi(GetAccountRoute, async (c) => {
  const { identifier } = c.req.valid('param');

  if (identifier.includes('@')) {
    const res = await controller.getAccountByName(identifier);
    if (Result.isErr(res)) {
      const error = Result.unwrapErr(res);
      accountModuleLogger.warn(error);
      if (error instanceof AccountNotFoundError) {
        return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
      }
      accountModuleLogger.error('Uncaught error', error);
      return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
    }
    const account = Result.unwrap(res);
    return c.json(
      {
        id: account.id,
        name: account.name,
        nickname: account.nickname,
        bio: account.bio,
        avatar: account.avatar,
        header: account.header,
        followed_count: account.followed_count,
        following_count: account.following_count,
        note_count: account.note_count,
      },
      200,
    );
  }

  const res = await controller.getAccount(identifier);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    accountModuleLogger.warn(error);
    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    accountModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }
  const account = Result.unwrap(res);
  return c.json(
    {
      id: account.id,
      name: account.name,
      nickname: account.nickname,
      bio: account.bio,
      avatar: account.avatar,
      header: account.header,
      followed_count: account.followed_count,
      following_count: account.following_count,
      note_count: account.note_count,
    },
    200,
  );
});

accountHandlers.openapi(ResendVerificationEmailRoute, async (c) => {
  const name = c.req.param('name');

  const res = await controller.resendVerificationEmail(name);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    accountModuleLogger.warn(error);
    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    if (error instanceof AccountMailAddressAlreadyVerifiedError) {
      return c.json({ error: 'ACCOUNT_ALREADY_VERIFIED' as const }, 400);
    }
    accountModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return new Response(null, { status: 204 });
});

accountHandlers.openapi(GetAccountFollowingRoute, async (c) => {
  const id = c.req.param('id');
  const res = await controller.fetchFollowing(id);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    accountModuleLogger.warn(error);
    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    accountModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }
  const unwrap = Result.unwrap(res);
  return c.json(
    unwrap.map((v) => {
      return {
        id: v.id,
        name: v.name,
        nickname: v.nickname,
        bio: v.bio,
        avatar: v.avatar,
        header: v.header,
        followed_count: v.followed_count,
        following_count: v.following_count,
        note_count: v.note_count,
      };
    }),
    200,
  );
});

accountHandlers.openapi(GetAccountFollowerRoute, async (c) => {
  const id = c.req.param('id');
  const res = await controller.fetchFollower(id);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    accountModuleLogger.warn(error);
    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    accountModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }
  const unwrap = Result.unwrap(res);
  return c.json(
    unwrap.map((v) => {
      return {
        id: v.id,
        name: v.name,
        nickname: v.nickname,
        bio: v.bio,
        avatar: v.avatar,
        header: v.header,
        followed_count: v.followed_count,
        following_count: v.following_count,
        note_count: v.note_count,
      };
    }),
    200,
  );
});

accountHandlers[GetAccountRelationshipsRoute.method](
  GetAccountRelationshipsRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);

accountHandlers.openapi(GetAccountRelationshipsRoute, async (c) => {
  const targetAccountID = c.req.param('id');
  const fromAccountID = Option.unwrap(c.get('accountID'));

  const res = await controller.getAccountRelationships(
    targetAccountID,
    fromAccountID,
  );
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    accountModuleLogger.warn(error);
    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    accountModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(Result.unwrap(res), 200);
});
