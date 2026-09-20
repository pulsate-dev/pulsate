import { Cat, Ether, Promise } from '@mikuroxina/mini-fn';
import { clockSymbol } from '../internal/id/mod.ts';
import {
  type AuthenticationTokenService,
  authenticateToken,
  authenticateTokenSymbol,
} from './service/authenticationTokenService.ts';

class Clock {
  now() {
    return BigInt(Date.now());
  }
}
export const clock = Ether.newEther(clockSymbol, () => new Clock());

const composer = Ether.composeT(Promise.monad);
const liftOverPromise = Ether.liftEther(Promise.monad);

// NOTE: `AuthenticationTokenService` generates a key pair on construction, so
// it must be shared as a single instance across `accounts/mod.ts` and
// `adaptors/authenticateMiddleware.ts`. Otherwise a token signed with one
// instance's key cannot be verified with another's.
const authTokenObj: globalThis.Promise<AuthenticationTokenService> =
  Ether.runEtherT(
    Cat.cat(authenticateToken).feed(composer(liftOverPromise(clock))).value,
  );

export const authToken = Ether.newEtherT<Promise.PromiseHkt>()(
  authenticateTokenSymbol,
  () => authTokenObj,
);

export const authenticationTokenService: globalThis.Promise<AuthenticationTokenService> =
  Ether.runEtherT(authToken);
