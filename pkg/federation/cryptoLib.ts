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
    return Result.err(new Error('', { cause: e }));
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
    return Result.err(new Error('', { cause: e }));
  }
};

const convertPEMToArrayBuffer = (key: string) => {
  const base64 = key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
};
