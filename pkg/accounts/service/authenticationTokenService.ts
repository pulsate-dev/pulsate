import { Ether, Option, type Promise, Result } from '@mikuroxina/mini-fn';
import * as jose from 'jose';

import { type Clock, clockSymbol } from '../../id/mod.js';
import {
  AccountAuthenticationTokenExpiredError,
  AccountAuthenticationTokenInvalidError,
} from '../model/errors.js';

declare const authenticationTokenNominal: unique symbol;
export type AuthenticationToken = string & {
  [authenticationTokenNominal]: unknown;
};

export class AuthenticationTokenService {
  private readonly privateKey: CryptoKey;
  private readonly publicKey: CryptoKey;
  private readonly clock: Clock;

  static async new(clock: Clock) {
    // generate ECDSA P-256 Private/Public Key (For JWT alg: "ES256")
    // cf. https://datatracker.ietf.org/doc/html/rfc7518#section-3.1
    const { privateKey, publicKey } = (await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify'],
    )) as CryptoKeyPair;
    return new AuthenticationTokenService(privateKey, publicKey, clock);
  }

  private constructor(
    privateKey: CryptoKey,
    publicKey: CryptoKey,
    clock: Clock,
  ) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.clock = clock;
  }

  public async generate(
    subject: string,
    accountName: string,
  ): Promise<Option.Option<AuthenticationToken>> {
    const currentTime = this.clock.now();

    const refreshToken = await new jose.SignJWT({
      accountName: accountName,
    })
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuedAt(Number(currentTime / 1000n))
      .setSubject(subject)
      // Note: 2592000s = 30days
      .setExpirationTime(Number(currentTime / 1000n) + 60 * 60 * 24 * 30)
      .sign(this.privateKey);

    const authToken = await new jose.SignJWT({
      accountName: accountName,
      refreshToken,
    })
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuedAt(Number(currentTime / 1000n))
      .setSubject(subject)
      // Note: 900s = 15min
      .setExpirationTime(Number(currentTime / 1000n) + 60 * 15)
      .sign(this.privateKey);

    return Option.some(authToken as AuthenticationToken);
  }

  public async renewAuthToken(
    token: AuthenticationToken,
  ): Promise<Result.Result<Error, AuthenticationToken>> {
    const { refreshToken, accountName, sub } = jose.decodeJwt(token);

    const authTokenVerifyRes = await this.verify(token);
    const refreshTokenVerifyRes = await this.verify(refreshToken as string);
    if (Result.isErr(authTokenVerifyRes)) {
      return authTokenVerifyRes;
    }
    if (Result.isErr(refreshTokenVerifyRes)) {
      return refreshTokenVerifyRes;
    }

    const currentTime = this.clock.now();

    const authToken = (await new jose.SignJWT({
      accountName,
      refreshToken,
    })
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuedAt(Number(currentTime / 1000n))
      .setSubject(sub ?? '')
      // Note: 900s = 15min
      .setExpirationTime(Number(currentTime / 1000n) + 60 * 15)
      .sign(this.privateKey)) as AuthenticationToken;

    return Result.ok(authToken as AuthenticationToken);
  }

  public async verify(token: string): Promise<Result.Result<Error, void>> {
    try {
      await jose.jwtVerify(token, this.publicKey);
      return Result.ok(undefined);
    } catch (e) {
      if (e instanceof jose.errors.JWTInvalid) {
        return Result.err(
          new AccountAuthenticationTokenInvalidError('Token is invalid', {
            cause: e,
          }),
        );
      }
      if (e instanceof jose.errors.JWTExpired) {
        return Result.err(
          new AccountAuthenticationTokenExpiredError('Token is expired', {
            cause: e,
          }),
        );
      }

      return Result.err(e as Error);
    }
  }
}

export const authenticateTokenSymbol =
  Ether.newEtherSymbol<AuthenticationTokenService>();
export const authenticateToken = Ether.newEtherT<Promise.PromiseHkt>()(
  authenticateTokenSymbol,
  ({ clock }) => AuthenticationTokenService.new(clock),
  {
    clock: clockSymbol,
  },
);
