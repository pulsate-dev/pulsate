import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import type { ActorKeyPair } from './actorKey.js';
import type { InstanceID } from './instance.js';

export type ActorID = ID<Actor>;

export interface CreateActorArgs {
  id: ActorID;
  instanceID: InstanceID;
  accountID: AccountID;
  profileURL: URL;

  inboxURL: URL;
  outboxURL: URL;
  followersURL: URL;
  followingURL: URL;
  sharedInboxURL: URL;
  actorKeyPair: ActorKeyPair[];
}

/**
 * ActivityPub Actor
 * @see https://www.w3.org/TR/activitypub/#actors
 */
export class Actor {
  /**
   * Actor ID
   * @example 31415926535
   */
  private readonly id: ActorID;
  /**
   * InstanceID
   * @example 27182818284
   */
  private readonly instanceID: InstanceID;
  /**
   * Account ID
   * @example 141421356
   */
  private readonly accountID: AccountID;
  /**
   * Actor profile URL
   * @example `https://social.example.com/accounts/@john@example.com`
   */
  private readonly profileURL: URL;

  /**
   * Actor Inbox URL
   * @example `https://social.example.com/accounts/31415926535/inbox`
   */
  private inboxURL: URL;
  /**
   * Actor Outbox URL
   * @example `https://social.example.com/accounts/31415926535/outbox`
   */
  private outboxURL: URL;
  /**
   * Actor Followers URL
   * @example `https://social.example.com/accounts/31415926535/followers`
   */
  private followersURL: URL;
  /**
   * Actor following URL
   * @example `https://social.example.com/accounts/31415926535/following`
   */
  private followingURL: URL;
  /**
   * Actor SharedInbox URL
   * @see https://www.w3.org/TR/activitypub/#shared-inbox-delivery
   * @example `https://social.example.com/shared`
   */
  private sharedInboxURL: URL;

  /**
   * Actor KeyPairs for activity signing / verifying
   * NOTE: Actor has multiple key pairs for activity signing / verifying
   * @see https://codeberg.org/fediverse/fep/src/branch/main/fep/521a/fep-521a.md
   * @see https://w3c.github.io/vc-data-integrity/vocab/security/vocabulary.html#Multikey
   */
  private readonly actorKeyPair: readonly ActorKeyPair[];

  private constructor(args: CreateActorArgs) {
    this.id = args.id;
    this.instanceID = args.instanceID;
    this.accountID = args.accountID;
    this.profileURL = args.profileURL;

    this.inboxURL = args.inboxURL;
    this.outboxURL = args.outboxURL;
    this.followersURL = args.followersURL;
    this.followingURL = args.followingURL;
    this.sharedInboxURL = args.sharedInboxURL;
    this.actorKeyPair = args.actorKeyPair;
  }

  static new(args: CreateActorArgs) {
    return new Actor(args);
  }

  /**
   * Actor ID
   * @example 31415926535
   */
  getID(): ActorID {
    return this.id;
  }

  /**
   * InstanceID
   * @example 27182818284
   */
  getInstanceID(): InstanceID {
    return this.instanceID;
  }

  /**
   * Account ID
   * @example 141421356
   */
  getAccountID(): AccountID {
    return this.accountID;
  }

  /**
   * Actor profile URL
   * @example `https://social.example.com/accounts/@john@example.com`
   */
  getProfileURL(): URL {
    return this.profileURL;
  }

  /**
   * Actor Inbox URL
   * @example `https://social.example.com/accounts/31415926535/inbox`
   */
  getInboxURL(): URL {
    return this.inboxURL;
  }

  /**
   *  Set Inbox URL
   * @param url Inbox URL
   */
  setInboxURL(url: URL) {
    this.inboxURL = url;
  }

  /**
   * Actor Outbox URL
   * @example `https://social.example.com/accounts/31415926535/outbox`
   */
  getOutboxURL(): URL {
    return this.outboxURL;
  }

  /**
   * Set Outbox URL
   * @param url Outbox URL
   */
  setOutboxURL(url: URL) {
    this.outboxURL = url;
  }

  /**
   * Actor Followers URL
   * @example `https://social.example.com/accounts/31415926535/followers`
   */
  getFollowersURL(): URL {
    return this.followersURL;
  }

  /**
   *  Set Followers URL
   * @param url Followers URL
   */
  setFollowersURL(url: URL) {
    this.followersURL = url;
  }

  /**
   * Actor following URL
   * @example `https://social.example.com/accounts/31415926535/following`
   */
  getFollowingURL(): URL {
    return this.followingURL;
  }

  /**
   * Set Following URL
   * @param url Following URL
   */
  setFollowingURL(url: URL) {
    this.followingURL = url;
  }

  /**
   * Actor SharedInbox URL
   * @see https://www.w3.org/TR/activitypub/#shared-inbox-delivery
   * @example `https://social.example.com/shared`
   */
  getSharedInboxURL(): URL {
    return this.sharedInboxURL;
  }

  /**
   * Set Shared Inbox URL
   * @param url Shared Inbox URL
   */
  setSharedInboxURL(url: URL) {
    this.sharedInboxURL = url;
  }

  /**
   * Actor KeyPairs for activity sign / verify
   * NOTE: Actor has multiple key pairs for activity signing / verifying
   * @see https://codeberg.org/fediverse/fep/src/branch/main/fep/521a/fep-521a.md
   * @see https://w3c.github.io/vc-data-integrity/vocab/security/vocabulary.html#Multikey
   */
  getActorKeyPair(): readonly ActorKeyPair[] {
    return this.actorKeyPair;
  }
}
