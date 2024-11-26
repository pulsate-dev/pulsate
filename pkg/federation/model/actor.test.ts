import { Option } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import { Actor, type ActorID } from './actor.js';
import { ActorKeyPair, type ActorKeyPairID, type PEMKey } from './actorKey.js';
import type { InstanceID } from './instance.js';

describe('Actor', () => {
  it('should create new instance', () => {
    const res = Actor.new({
      id: '1' as ActorID,
      instanceID: '31415926535' as InstanceID,
      accountID: '141421356' as AccountID,
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
          id: '10' as ActorKeyPairID,
          actorID: '1' as ActorID,
          publicKey: 'pubkey' as PEMKey,
          privateKey: Option.some('privkey' as PEMKey),
          publicKeyID: new URL('https://social.example.com/actor/1#main-key'),
        }),
      ],
    });

    expect(res).toMatchSnapshot();
  });
});
