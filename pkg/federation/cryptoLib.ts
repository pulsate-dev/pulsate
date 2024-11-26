import { Result } from '@mikuroxina/mini-fn';

export const importRSAKey = async (
  keyType: 'private' | 'public',
  key: string,
): Promise<Result.Result<Error, CryptoKey>> => {
  switch (keyType) {
    case 'private':
      return importRSAPrivateKey(key);
    case 'public':
      return importRSAPublicKey(key);
  }
};

const importRSAPrivateKey = async (
  key: string,
): Promise<Result.Result<Error, CryptoKey>> => {
  const keyArray = convertPEMToArrayBuffer(key);
  try {
    const keyObject = await crypto.subtle.importKey(
      'pkcs8',
      keyArray,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      true,
      ['sign'],
    );

    if (keyObject.type !== 'private') {
      return Result.err(new Error('This key is not public key'));
    }

    return Result.ok(keyObject);
  } catch (e) {
    return Result.err(new Error('Private key import failed', { cause: e }));
  }
};

const importRSAPublicKey = async (
  key: string,
): Promise<Result.Result<Error, CryptoKey>> => {
  const keyArray = convertPEMToArrayBuffer(key);
  try {
    const keyObject = await crypto.subtle.importKey(
      // NOTE: Import public key, use spki key format.
      'spki',
      keyArray,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      true,
      ['verify'],
    );

    if (keyObject.type !== 'public') {
      return Result.err(new Error('This key is not public key'));
    }

    return Result.ok(keyObject);
  } catch (e) {
    return Result.err(new Error('Public key import failed', { cause: e }));
  }
};

const convertPEMToArrayBuffer = (key: string) => {
  const base64 = key
    .replaceAll('-----BEGIN PRIVATE KEY-----', '')
    .replaceAll('-----BEGIN PUBLIC KEY-----', '')
    .replaceAll('-----END PUBLIC KEY-----', '')
    .replaceAll('-----END PRIVATE KEY-----', '')
    .replaceAll('\n', '');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
};
