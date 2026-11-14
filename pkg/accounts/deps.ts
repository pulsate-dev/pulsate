import { Cat, Ether, Promise } from '@mikuroxina/mini-fn';
import { prismaClient } from '../adaptors/prisma.ts';
import { mediaModuleFacadeEther } from '../intermodule/media.ts';
import {
  notificationModule,
  notificationModuleFacadeSymbol,
} from '../intermodule/notification.ts';
import { eventPublisherEther } from '../internal/event/mod.ts';
import { clockSymbol, snowflakeIDGenerator } from '../internal/id/mod.ts';
import { argon2idPasswordEncoder } from '../internal/password/mod.ts';
import { AccountController } from './adaptor/controller/account.ts';
import { InMemoryAccountRepository } from './adaptor/repository/dummy/account.ts';
import { inMemoryAccountAvatarRepo } from './adaptor/repository/dummy/avatar.ts';
import { newFollowRepo } from './adaptor/repository/dummy/follow.ts';
import { inMemoryAccountHeaderRepo } from './adaptor/repository/dummy/header.ts';
import { inactiveAccountRepo } from './adaptor/repository/dummy/inactiveAccount.ts';
import { verifyTokenRepo } from './adaptor/repository/dummy/verifyToken.ts';
import { prismaAccountAvatarRepo } from './adaptor/repository/prisma/avatar.ts';
import { prismaAccountHeaderRepo } from './adaptor/repository/prisma/header.ts';
import { prismaInactiveAccountRepo } from './adaptor/repository/prisma/inactiveAccount.ts';
import {
  PrismaAccountRepository,
  prismaFollowRepo,
  prismaVerifyTokenRepo,
} from './adaptor/repository/prisma/prisma.ts';
import { accountRepoSymbol } from './model/repository.ts';
import { authenticate } from './service/authenticate.ts';
import {
  authenticateToken,
  authenticateTokenSymbol,
} from './service/authenticationTokenService.ts';
import { accountAvatar } from './service/avatar.ts';
import { edit } from './service/edit.ts';
import { fetch } from './service/fetch.ts';
import { fetchFollow } from './service/fetchFollow.ts';
import { follow } from './service/follow.ts';
import { freeze } from './service/freeze.ts';
import { accountHeader } from './service/header.ts';
import { register } from './service/register.ts';
import { fetchRelationship } from './service/relationships.ts';
import { resendToken } from './service/resendToken.ts';
import { silence } from './service/silence.ts';
import { unfollow } from './service/unfollow.ts';
import { verifyAccountToken } from './service/verifyToken.ts';
import { dummyAccounts } from './testData/testData.ts';

class Clock {
  now() {
    return BigInt(Date.now());
  }
}
export const clock = Ether.newEther(clockSymbol, () => new Clock());

const composer = Ether.composeT(Promise.monad);
const liftOverPromise = Ether.liftEther(Promise.monad);

// The controller and authentication middleware must share the same signing key.
const authTokenObj = Ether.runEtherT(
  Cat.cat(authenticateToken).feed(composer(liftOverPromise(clock))).value,
);

export const authToken = Ether.newEtherT<Promise.PromiseHkt>()(
  authenticateTokenSymbol,
  () => authTokenObj,
);

export const authenticationTokenService = Ether.runEtherT(authToken);

const isProduction = process.env.NODE_ENV === 'production';

const accountRepoObject = isProduction
  ? new PrismaAccountRepository(prismaClient)
  : new InMemoryAccountRepository(dummyAccounts);
const accountRepository = Ether.newEther(
  accountRepoSymbol,
  () => accountRepoObject,
);

const accountFollowRepository = isProduction
  ? prismaFollowRepo(prismaClient)
  : newFollowRepo();
const accountHeaderRepository = isProduction
  ? prismaAccountHeaderRepo(prismaClient)
  : inMemoryAccountHeaderRepo([], []);
const accountAvatarRepository = isProduction
  ? prismaAccountAvatarRepo(prismaClient)
  : inMemoryAccountAvatarRepo([], []);

const idGenerator = Ether.compose(clock)(snowflakeIDGenerator(0));

const inactiveAccountRepository = isProduction
  ? prismaInactiveAccountRepo(prismaClient)
  : inactiveAccountRepo;

const verifyAccountTokenService = Cat.cat(verifyAccountToken)
  .feed(Ether.compose(clock))
  .feed(
    Ether.compose(
      isProduction ? prismaVerifyTokenRepo(prismaClient) : verifyTokenRepo,
    ),
  )
  .feed(Ether.compose(inactiveAccountRepository))
  .feed(Ether.compose(accountRepository))
  .feed(Ether.compose(eventPublisherEther)).value;

export const controller = new AccountController({
  authenticateService: await Ether.runEtherT(
    Cat.cat(liftOverPromise(authenticate))
      .feed(composer(liftOverPromise(accountRepository)))
      .feed(composer(authToken))
      .feed(composer(liftOverPromise(argon2idPasswordEncoder))).value,
  ),
  editService: Ether.runEther(
    Cat.cat(edit)
      .feed(Ether.compose(accountRepository))
      .feed(Ether.compose(argon2idPasswordEncoder))
      .feed(Ether.compose(eventPublisherEther)).value,
  ),
  fetchService: Ether.runEther(
    Cat.cat(fetch).feed(Ether.compose(accountRepository)).value,
  ),
  followService: Ether.runEther(
    Cat.cat(follow)
      .feed(Ether.compose(clock))
      .feed(Ether.compose(accountRepository))
      .feed(Ether.compose(accountFollowRepository))
      .feed(Ether.compose(eventPublisherEther)).value,
  ),
  freezeService: Ether.runEther(
    Cat.cat(freeze)
      .feed(Ether.compose(accountRepository))
      .feed(Ether.compose(eventPublisherEther)).value,
  ),
  registerService: Ether.runEther(
    Cat.cat(register)
      .feed(Ether.compose(inactiveAccountRepository))
      .feed(Ether.compose(idGenerator))
      .feed(Ether.compose(argon2idPasswordEncoder))
      .feed(
        Ether.compose(
          Ether.newEther(
            notificationModuleFacadeSymbol,
            () => notificationModule,
          ),
        ),
      )
      .feed(Ether.compose(verifyAccountTokenService))
      .feed(Ether.compose(eventPublisherEther)).value,
  ),
  silenceService: Ether.runEther(
    Cat.cat(silence)
      .feed(Ether.compose(accountRepository))
      .feed(Ether.compose(eventPublisherEther)).value,
  ),
  verifyAccountTokenService: Ether.runEther(verifyAccountTokenService),
  unFollowService: Ether.runEther(
    Cat.cat(unfollow)
      .feed(Ether.compose(accountFollowRepository))
      .feed(Ether.compose(accountRepository))
      .feed(Ether.compose(clock))
      .feed(Ether.compose(eventPublisherEther)).value,
  ),
  resendTokenService: Ether.runEther(
    Cat.cat(resendToken)
      .feed(Ether.compose(inactiveAccountRepository))
      .feed(Ether.compose(verifyAccountTokenService))
      .feed(
        Ether.compose(
          Ether.newEther(
            notificationModuleFacadeSymbol,
            () => notificationModule,
          ),
        ),
      ).value,
  ),
  fetchFollowService: Ether.runEther(
    Cat.cat(fetchFollow)
      .feed(Ether.compose(accountFollowRepository))
      .feed(Ether.compose(accountRepository)).value,
  ),
  headerService: Ether.runEther(
    Cat.cat(accountHeader)
      .feed(Ether.compose(accountHeaderRepository))
      .feed(Ether.compose(mediaModuleFacadeEther)).value,
  ),
  avatarService: Ether.runEther(
    Cat.cat(accountAvatar)
      .feed(Ether.compose(accountAvatarRepository))
      .feed(Ether.compose(mediaModuleFacadeEther)).value,
  ),
  authenticationTokenService: await authenticationTokenService,
  fetchRelationshipService: Ether.runEther(
    Cat.cat(fetchRelationship)
      .feed(Ether.compose(accountRepository))
      .feed(Ether.compose(accountFollowRepository)).value,
  ),
});
