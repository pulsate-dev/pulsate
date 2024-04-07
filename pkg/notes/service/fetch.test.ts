import { Option } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it } from 'vitest';

import { AccountController } from '../../accounts/adaptor/controller/account.js';
import {
  InMemoryAccountFollowRepository,
  InMemoryAccountRepository,
  InMemoryAccountVerifyTokenRepository,
} from '../../accounts/adaptor/repository/dummy.js';
import { Account, type AccountID } from '../../accounts/model/account.js';
import { AuthenticationService } from '../../accounts/service/authenticate.js';
import { EditAccountService } from '../../accounts/service/editAccount.js';
import { EtagVerifyService } from '../../accounts/service/etagGenerateVerify.js';
import { FetchAccountService } from '../../accounts/service/fetchAccount.js';
import { FollowService } from '../../accounts/service/follow.js';
import { FreezeService } from '../../accounts/service/freeze.js';
import { RegisterAccountService } from '../../accounts/service/register.js';
import { ResendVerifyTokenService } from '../../accounts/service/resendToken.js';
import { DummySendNotificationService } from '../../accounts/service/sendNotification.js';
import { SilenceService } from '../../accounts/service/silence.js';
import { TokenGenerator } from '../../accounts/service/tokenGenerator.js';
import { UnfollowService } from '../../accounts/service/unfollow.js';
import { VerifyAccountTokenService } from '../../accounts/service/verifyToken.js';
import { MockClock, SnowflakeIDGenerator } from '../../id/mod.js';
import type { ID } from '../../id/type.js';
import { AccountModule } from '../../intermodule/account.js';
import { Argon2idPasswordEncoder } from '../../password/mod.js';
import { InMemoryNoteRepository } from '../adaptor/repository/dummy.js';
import { Note, type NoteID } from '../model/note.js';
import { FetchNoteService } from './fetch.js';

const testNote = Note.new({
  id: '1' as ID<NoteID>,
  authorID: '3' as ID<AccountID>,
  content: 'Hello world',
  contentsWarningComment: '',
  createdAt: new Date('2023-09-10T00:00:00Z'),
  sendTo: Option.none(),
  visibility: 'PUBLIC',
});
const deletedNote = Note.reconstruct({
  id: '2' as ID<NoteID>,
  authorID: '3' as ID<AccountID>,
  content: 'Hello world',
  contentsWarningComment: '',
  createdAt: new Date('2023-09-10T00:00:00Z'),
  sendTo: Option.none(),
  visibility: 'PUBLIC',
  deletedAt: Option.some(new Date('2024-01-01T00:00:00Z')),
  updatedAt: Option.none(),
});
const frozenUserNote = Note.reconstruct({
  id: '5' as ID<NoteID>,
  authorID: '4' as ID<AccountID>,
  content: 'Hello world',
  contentsWarningComment: '',
  createdAt: new Date('2023-09-10T00:00:00Z'),
  sendTo: Option.none(),
  visibility: 'PUBLIC',
  deletedAt: Option.some(new Date('2024-01-01T00:00:00Z')),
  updatedAt: Option.none(),
});
const testAccount = Account.reconstruct({
  id: '3' as ID<AccountID>,
  bio: '',
  frozen: 'normal',
  mail: '',
  name: '@johndoe@example.com',
  nickname: '',
  passphraseHash: undefined,
  role: 'normal',
  silenced: 'normal',
  status: 'active',
  createdAt: new Date('2023-09-10T00:00:00Z'),
  deletedAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: undefined,
});
const frozenAccount = Account.reconstruct({
  id: '4' as ID<AccountID>,
  bio: '',
  frozen: 'frozen',
  mail: '',
  name: '@frozen@example.com',
  nickname: '',
  passphraseHash: undefined,
  role: 'normal',
  silenced: 'normal',
  status: 'active',
  createdAt: new Date('2023-09-10T00:00:00Z'),
  deletedAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: undefined,
});

const repository = new InMemoryNoteRepository([
  testNote,
  frozenUserNote,
  deletedNote,
]);
const accountRepository = new InMemoryAccountRepository([
  testAccount,
  frozenAccount,
]);
const accountFollowRepository = new InMemoryAccountFollowRepository();
const accountVerifyTokenRepository = new InMemoryAccountVerifyTokenRepository();
const tokenGenerator = await TokenGenerator.new();
class Clock {
  now() {
    return BigInt(Date.now());
  }
}
const idGenerator = new SnowflakeIDGenerator(0, new MockClock(new Date()));
const passwordEncoder = new Argon2idPasswordEncoder();
const accountController = new AccountController({
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
    verifyAccountTokenService: new VerifyAccountTokenService(
      accountVerifyTokenRepository,
      accountRepository,
      new Clock(),
    ),
  }),
  silenceService: new SilenceService(accountRepository),
  verifyAccountTokenService: new VerifyAccountTokenService(
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
    new VerifyAccountTokenService(
      accountVerifyTokenRepository,
      accountRepository,
      new Clock(),
    ),
    new DummySendNotificationService(),
  ),
});
const accountModule = new AccountModule(accountController);
const service = new FetchNoteService(repository, accountModule);

describe('FetchNoteService', () => {
  afterEach(() => accountRepository.reset());

  it('should fetch notes', async () => {
    const res = await service.fetchNoteByID('1' as ID<NoteID>);

    expect(Option.isSome(res)).toBe(true);
    expect(res[1]).toStrictEqual(testNote);
  });

  it('note not found', async () => {
    const res = await service.fetchNoteByID('999' as ID<NoteID>);

    expect(Option.isNone(res)).toBe(true);
  });

  it('note deleted', async () => {
    const res = await service.fetchNoteByID(deletedNote.getID());

    expect(Option.isNone(res)).toBe(true);
  });

  it('account frozen', async () => {
    const res = await service.fetchNoteByID(frozenUserNote.getID());

    expect(Option.isNone(res)).toBe(true);
  });
});
