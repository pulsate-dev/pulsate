import { Option, Result } from '@mikuroxina/mini-fn';
import type { ID } from '../../id/type.js';
import { importRSAKey } from '../cryptoLib.js';
import type { ActorID } from './actor.js';

export type ActorKeyPairID = ID<ActorKeyPair>;

export interface CreateActorKeyPairArgs {
  id: ActorKeyPairID;
  actorID: ActorID;
  publicKeyID: URL;
  publicKey: string;
  privateKey: Option.Option<string>;
}

/**
 * Key for sign/verify ActivityPub activity objects
 * @see https://docs.joinmastodon.org/spec/activitypub/#publicKey
 */
export class ActorKeyPair {
  private readonly id: ActorKeyPairID;
  /**
   * Actor ID who owns this key pair
   */
  private readonly actorID: ActorID;

  /**
   * Public key ID URL
   * @example `https://example.com/users/1#main-key`
   */
  private readonly publicKeyID: URL;
  /**
   * Public key for verify ActivityPub activity objects (PEM Format)
   */
  private readonly publicKey: string;

  /**
   * Private key for sign ActivityPub activity objects (PEM Format)\
   * NOTE: if actor is remote account, this field is `Option.None`.
   */
  private readonly privateKey: Option.Option<string>;

  private constructor(args: CreateActorKeyPairArgs) {
    this.id = args.id;
    this.actorID = args.actorID;
    this.publicKeyID = args.publicKeyID;
    this.publicKey = args.publicKey;
    this.privateKey = args.privateKey;
  }

  static new(args: CreateActorKeyPairArgs) {
    return new ActorKeyPair(args);
  }

  /**
   * ActorKeyPair id
   * @returns ActorKeyPair ID
   */
  getID(): ActorKeyPairID {
    return this.id;
  }

  /**
   * Actor ID who owns this key pair
   * @returns Actor ID
   */
  getActorID(): ActorID {
    return this.actorID;
  }

  /**
   * Public key ID URL
   * @returns Public key ID URL
   * @example `https://example.com/users/1#main-key`
   */
  getPublicKeyID(): URL {
    return this.publicKeyID;
  }

  /**
   * Public key for verify ActivityPub activity objects (PEM Format)
   * @returns Public key
   */
  getPublicKeyString(): string {
    return this.publicKey;
  }

  /**
   * Public key object
   * @returns CryptoKey https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey
   */
  async getPublicKeyObject(): Promise<Result.Result<Error, CryptoKey>> {
    return importRSAKey('public', this.publicKey);
  }

  /**
   * Private key for sign ActivityPub activity objects (PEM Format)\
   * NOTE: if actor is remote account, this field is `Option.None`.
   * @returns Private key
   */
  getPrivateKeyString(): Option.Option<string> {
    return this.privateKey;
  }

  /**
   * Private key object
   * @returns CryptoKey https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey
   */
  async getPrivateKeyObject(): Promise<Result.Result<Error, CryptoKey>> {
    if (Option.isNone(this.privateKey)) {
      // ToDo: Replace Error type
      return Result.err(new Error(''));
    }
    const privateKey = Option.unwrap(this.privateKey);

    return importRSAKey('private', privateKey);
  }
}
