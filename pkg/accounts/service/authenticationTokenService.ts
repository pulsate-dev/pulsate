import { Ether, Option, type Promise } from '@mikuroxina/mini-fn';
import * as jose from 'jose';

import { type Clock, clockSymbol } from '../../id/mod.js';

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

    const authToken = (await new jose.SignJWT({
      accountName: accountName,
      refreshToken,
    })
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuedAt(Number(currentTime / 1000n))
      .setSubject(subject)
      // Note: 900s = 15min
      .setExpirationTime(Number(currentTime / 1000n) + 60 * 15)
      .sign(this.privateKey)) as AuthenticationToken;

    return Option.some(authToken);
  }

  public async verify(token: string): Promise<boolean> {
    try {
      await jose.jwtVerify(token, this.publicKey);
      return true;
    } catch {
      return false;
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
