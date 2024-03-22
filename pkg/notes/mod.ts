import { OpenAPIHono } from '@hono/zod-openapi';
import { Result } from '@mikuroxina/mini-fn';

import { AccountController } from '../accounts/adaptor/controller/account.js';
import {
  InMemoryAccountFollowRepository,
  InMemoryAccountRepository,
  InMemoryAccountVerifyTokenRepository,
} from '../accounts/adaptor/repository/dummy.js';
import { TokenVerifyService } from '../accounts/service/accountVerifyToken.js';
import { AuthenticationService } from '../accounts/service/authenticate.js';
import { EditAccountService } from '../accounts/service/editAccount.js';
import { EtagVerifyService } from '../accounts/service/etagGenerateVerify.js';
import { FetchAccountService } from '../accounts/service/fetchAccount.js';
import { FollowService } from '../accounts/service/follow.js';
import { FreezeService } from '../accounts/service/freeze.js';
import { RegisterAccountService } from '../accounts/service/register.js';
import { ResendVerifyTokenService } from '../accounts/service/resendToken.js';
import { DummySendNotificationService } from '../accounts/service/sendNotification.js';
import { SilenceService } from '../accounts/service/silence.js';
import { TokenGenerator } from '../accounts/service/tokenGenerator.js';
import { UnfollowService } from '../accounts/service/unfollow.js';
import { SnowflakeIDGenerator } from '../id/mod.js';
import { AccountModule } from '../intermodule/account.js';
import { Argon2idPasswordEncoder } from '../password/mod.js';
import { NoteController } from './adaptor/controller/note.js';
import { InMemoryNoteRepository } from './adaptor/repository/dummy.js';
import { CreateNoteRoute, GetNoteRoute } from './router.js';
import { CreateNoteService } from './service/create.js';
import { FetchNoteService } from './service/fetch.js';

export const noteHandlers = new OpenAPIHono();
const noteRepository = new InMemoryNoteRepository();
const idGenerator = new SnowflakeIDGenerator(0, {
  now: () => BigInt(Date.now()),
});
const createNoteService = new CreateNoteService(noteRepository, idGenerator);
const fetchNoteService = new FetchNoteService(noteRepository);

// Account
const accountRepository = new InMemoryAccountRepository();
const accountFollowRepository = new InMemoryAccountFollowRepository();
const accountVerifyTokenRepository = new InMemoryAccountVerifyTokenRepository();
const tokenGenerator = await TokenGenerator.new();
class Clock {
  now() {
    return BigInt(Date.now());
  }
}
const passwordEncoder = new Argon2idPasswordEncoder();
export const accountController = new AccountController({
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

const accountModule = new AccountModule(accountController);
const controller = new NoteController(
  createNoteService,
  fetchNoteService,
  accountModule,
);

noteHandlers.doc('/notes/doc.json', {
  openapi: '3.0.0',
  info: {
    title: 'Notes API',
    version: '0.1.0',
  },
});

noteHandlers.openapi(CreateNoteRoute, async (c) => {
  const { content, visibility, contents_warning_comment, send_to } =
    c.req.valid('json');
  const res = await controller.createNote(
    '',
    content,
    visibility,
    contents_warning_comment,
    send_to,
  );
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, 400);
  }

  return c.json(res[1]);
});

noteHandlers.openapi(GetNoteRoute, async (c) => {
  const { id } = c.req.param();
  const res = await controller.getNoteByID(id);
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, 404);
  }

  return c.json(res[1]);
});
