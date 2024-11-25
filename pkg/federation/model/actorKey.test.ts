import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { ActorID } from './actor.js';
import { ActorKeyPair, type ActorKeyPairID } from './actorKey.js';

describe('ActorKeyPair', () => {
  it('should create new instance', () => {
    const res = ActorKeyPair.new({
      id: '1' as ActorKeyPairID,
      actorID: '10' as ActorID,
      publicKeyID: new URL('https://social.example.com/actor/1#main-key'),
      publicKey: `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAqKU7f9DTbeIzv0a4M5R9
BEWrDb/4SCT9IBLSgl/F+07fjyYbglE5TMEnaZI+uC+sFkP6rU7nWRQQgRGmQjdd
v31ow1RsdBC0DB3hM/ro9m39kpfiiE/FHOD1nZyM/eLR2YXVwQWHxT1qCzyBAj+G
FVhyIbO2iP2IDtmGC9zpgmPWrlxjFCtwXJI5hzV/EPXCNxEG5iPJjvFRxKiM0YeT
Xl9pVzxwBq5HIhLt7F/8hWOKZjyzz9WnAZPJYo50SxEGSSLthgTwSqmgsQqkDA22
5db/+N9furiGA3XPeZ+J92EVkzB/sj7iYNeyfey4RR+1pYjTWkjMN0MV9rF9KUzH
y1to9iAmiDwnwufKFAYCoe0aMzFzzGCUKfXdwZHxOWSLb9qoU2Nh6C+k2GiH1Pn2
nEFkeNR/22kg2oSUGZtPiUEEfvnoK41nYkTAO4jVjwhdD1OjEFppBbJJRf1af8pw
Ood5BmUWJtg96v2FYxxjnDBQkD1qFpvFWoyzRNU9owBlTUKD+qI6NH0jGVlwlGDJ
kZsIgf4501KTKY3YH3fHKj3bXb9MozcTrKQW12arM5jFEX6DXYy77YqA5bmXhM9x
BphzO/AaWgS/aBlm//20N6c3Oxzi1vi4VKVFRVYcKsk9jnSxlkpsm1GzKd8WJEeZ
tLtTfqF3d8xvBL9knI2i628CAwEAAQ==
-----END PUBLIC KEY-----`,
      privateKey: Option.some(`-----BEGIN PRIVATE KEY-----
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
vfBYk096qOEdFfQma6qWoXYQa4orPLtI
-----END PRIVATE KEY-----`),
    });

    expect(res).toMatchSnapshot();
  });

  it('should output CryptoKeyPair', async () => {
    const keyPair = ActorKeyPair.new({
      id: '1' as ActorKeyPairID,
      actorID: '10' as ActorID,
      publicKeyID: new URL('https://social.example.com/actor/1#main-key'),
      publicKey: `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAqKU7f9DTbeIzv0a4M5R9
BEWrDb/4SCT9IBLSgl/F+07fjyYbglE5TMEnaZI+uC+sFkP6rU7nWRQQgRGmQjdd
v31ow1RsdBC0DB3hM/ro9m39kpfiiE/FHOD1nZyM/eLR2YXVwQWHxT1qCzyBAj+G
FVhyIbO2iP2IDtmGC9zpgmPWrlxjFCtwXJI5hzV/EPXCNxEG5iPJjvFRxKiM0YeT
Xl9pVzxwBq5HIhLt7F/8hWOKZjyzz9WnAZPJYo50SxEGSSLthgTwSqmgsQqkDA22
5db/+N9furiGA3XPeZ+J92EVkzB/sj7iYNeyfey4RR+1pYjTWkjMN0MV9rF9KUzH
y1to9iAmiDwnwufKFAYCoe0aMzFzzGCUKfXdwZHxOWSLb9qoU2Nh6C+k2GiH1Pn2
nEFkeNR/22kg2oSUGZtPiUEEfvnoK41nYkTAO4jVjwhdD1OjEFppBbJJRf1af8pw
Ood5BmUWJtg96v2FYxxjnDBQkD1qFpvFWoyzRNU9owBlTUKD+qI6NH0jGVlwlGDJ
kZsIgf4501KTKY3YH3fHKj3bXb9MozcTrKQW12arM5jFEX6DXYy77YqA5bmXhM9x
BphzO/AaWgS/aBlm//20N6c3Oxzi1vi4VKVFRVYcKsk9jnSxlkpsm1GzKd8WJEeZ
tLtTfqF3d8xvBL9knI2i628CAwEAAQ==
-----END PUBLIC KEY-----`,
      privateKey: Option.some(`-----BEGIN PRIVATE KEY-----
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
vfBYk096qOEdFfQma6qWoXYQa4orPLtI
-----END PRIVATE KEY-----`),
    });

    const publicKey = await keyPair.getPublicKeyObject();
    const privateKey = await keyPair.getPrivateKeyObject();

    expect(Result.isOk(publicKey)).toBeTruthy();
    expect(Result.isOk(privateKey)).toBeTruthy();

    expect(Result.unwrap(publicKey).type).toBe('public');
    expect(Result.unwrap(publicKey).usages).toStrictEqual(['verify']);
    expect(Result.unwrap(privateKey).type).toBe('private');
    expect(Result.unwrap(privateKey).usages).toStrictEqual(['sign']);
  });
});
