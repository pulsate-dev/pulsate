import { OpenAPIHono } from '@hono/zod-openapi';
import { Result } from '@mikuroxina/mini-fn';

import { AccountController } from '../accounts/adaptor/controller/account.js';
import {
  InMemoryAccountFollowRepository,
  InMemoryAccountRepository,
  InMemoryAccountVerifyTokenRepository,
} from '../accounts/adaptor/repository/dummy.js';
import { AuthenticateAccountService } from '../accounts/service/authenticateAccount.js';
import { EditAccountService } from '../accounts/service/editAccount.js';
import { EtagVerifyService } from '../accounts/service/etagGenerateVerify.js';
import { FetchAccountService } from '../accounts/service/fetchAccount.js';
import { FollowAccountService } from '../accounts/service/followAccount.js';
import { FreezeAccountService } from '../accounts/service/freezeAccount.js';
import { RegisterAccountService } from '../accounts/service/registerAccount.js';
import { ResendVerifyTokenService } from '../accounts/service/resendToken.js';
import { DummySendNotificationService } from '../accounts/service/sendNotification.js';
import { SilenceAccountService } from '../accounts/service/silenceAccount.js';
import { TokenGenerator } from '../accounts/service/tokenGenerator.js';
import { UnfollowAccountService } from '../accounts/service/unfollowAccount.js';
import { VerifyAccountTokenService } from '../accounts/service/verifyAccountToken.js';
import { SnowflakeIDGenerator } from '../id/mod.js';
import { AccountModule } from '../intermodule/account.js';
import { Argon2idPasswordEncoder } from '../password/mod.js';
import { NoteController } from './adaptor/controller/note.js';
import { InMemoryNoteRepository } from './adaptor/repository/dummy.js';
import { CreateNoteRoute, GetNoteRoute } from './router.js';
import { CreateNoteService } from './service/createNote.js';
import { FetchNoteService } from './service/fetchNote.js';

export const noteHandlers = new OpenAPIHono();
const noteRepository = new InMemoryNoteRepository();
const idGenerator = new SnowflakeIDGenerator(0, {
  now: () => BigInt(Date.now()),
});

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
const accountController = new AccountController({
  authenticateAccountService: new AuthenticateAccountService({
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
  followAccountService: new FollowAccountService(
    accountFollowRepository,
    accountRepository,
  ),
  freezeAccountService: new FreezeAccountService(accountRepository),
  registerAccountService: new RegisterAccountService({
    repository: accountRepository,
    idGenerator: idGenerator,
    passwordEncoder: passwordEncoder,
    sendNotification: new DummySendNotificationService(),
    verifyAccountTokenService: new VerifyAccountTokenService(
      accountVerifyTokenRepository,
      accountRepository,
      new Clock(),
    ),
  }),
  silenceAccountService: new SilenceAccountService(accountRepository),
  verifyAccountTokenService: new VerifyAccountTokenService(
    accountVerifyTokenRepository,
    accountRepository,
    new Clock(),
  ),
  unfollowAccountService: new UnfollowAccountService(
    accountFollowRepository,
    accountRepository,
  ),
  resendTokenService: new ResendVerifyTokenService(
    accountRepository,
    new VerifyAccountTokenService(
      accountVerifyTokenRepository,
      accountRepository,
      new Clock(),
    ),
    new DummySendNotificationService(),
  ),
});

const accountModule = new AccountModule(accountController);
// Note
const createNoteService = new CreateNoteService(noteRepository, idGenerator);
const fetchNoteService = new FetchNoteService(noteRepository, accountModule);
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
