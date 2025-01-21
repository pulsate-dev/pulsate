import { Ether, Option, type Promise } from '@mikuroxina/mini-fn';
import * as jose from 'jose';

import { type Clock, clockSymbol } from '../../id/mod.js';
import type { PulsateTime } from '../../time/mod.js';

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
    issuedAt: PulsateTime,
    expiredAt: PulsateTime,
    accountName: string,
  ): Promise<Option.Option<string>> {
    const token = await new jose.SignJWT({
      accountName: accountName,
    })
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuedAt(issuedAt)
      .setSubject(subject)
      .setExpirationTime(expiredAt)
      .sign(this.privateKey);

    return Option.some(token);
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
