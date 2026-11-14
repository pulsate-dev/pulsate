import { Option } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { Account } from '../../accounts/model/account.ts';
import { generateDummyID } from '../../internal/id/dummy.ts';
import { Actor } from './actor.ts';
import { ActorKeyPair, type PEMKey } from './actorKey.ts';
import type { Instance } from './instance.ts';

describe('Actor', () => {
  it('should create new instance', () => {
    const actorID = generateDummyID<Actor>();
    const instanceID = generateDummyID<Instance>();
    const accountID = generateDummyID<Account>();
    const actorKeyPairID = generateDummyID<ActorKeyPair>();
    const res = Actor.new({
      id: actorID,
      instanceID: instanceID,
      accountID: accountID,
      profileURL: new URL(
        'https://social.example.com/accounts/@john@example.com',
      ),
      inboxURL: new URL(
        'https://social.example.com/accounts/31415926535/inbox',
      ),
      outboxURL: new URL(
        'https://social.example.com/accounts/31415926535/outbox',
      ),
      followersURL: new URL(
        'https://social.example.com/accounts/31415926535/followers',
      ),
      followingURL: new URL(
        'https://social.example.com/accounts/31415926535/following',
      ),
      sharedInboxURL: new URL('https://social.example.com/shared-inbox'),
      actorKeyPair: [
        ActorKeyPair.new({
          id: actorKeyPairID,
          actorID,
          publicKey: 'pubkey' as PEMKey,
          privateKey: Option.some('privkey' as PEMKey),
          publicKeyID: new URL('https://social.example.com/actor/1#main-key'),
        }),
      ],
    });

    expect(res.getID()).toBe(actorID);
    expect(res.getInstanceID()).toBe(instanceID);
    expect(res.getAccountID()).toBe(accountID);
    expect(res.getProfileURL()).toEqual(
      new URL('https://social.example.com/accounts/@john@example.com'),
    );
    expect(res.getInboxURL()).toEqual(
      new URL('https://social.example.com/accounts/31415926535/inbox'),
    );
    expect(res.getActorKeyPair()).toHaveLength(1);
    expect(res.getActorKeyPair()[0]?.getID()).toBe(actorKeyPairID);
  });
});
