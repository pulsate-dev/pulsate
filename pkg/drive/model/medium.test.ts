import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import { MediaSizeTooLargeError, MediaTypeInvalidError } from './errors.js';
import { Medium, type MediumID } from './medium.js';

const baseArgs = {
  id: '1' as MediumID,
  name: 'test.webp',
  authorId: '10' as AccountID,
  hash: 'blurhash',
  mime: 'image/webp',
  nsfw: false,
  url: Option.none(),
  thumbnailUrl: Option.none(),
  size: 1024,
  maxSize: 1024 * 1024,
} as const;

describe('Medium.new', () => {
  it('creates a medium when the source is valid', () => {
    const res = Medium.new({ ...baseArgs, sourceMime: 'image/png' });

    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res).getMime()).toBe('image/webp');
  });

  it('rejects a disallowed source MIME type', () => {
    const res = Medium.new({ ...baseArgs, sourceMime: 'image/heic' });

    expect(Result.isErr(res)).toBe(true);
    expect(res[1]).toStrictEqual(
      new MediaTypeInvalidError('Invalid file type', { cause: null }),
    );
  });

  it('rejects a file larger than the limit', () => {
    const res = Medium.new({
      ...baseArgs,
      sourceMime: 'image/png',
      size: baseArgs.maxSize + 1,
    });

    expect(Result.isErr(res)).toBe(true);
    expect(res[1]).toStrictEqual(
      new MediaSizeTooLargeError('File size is too large', { cause: null }),
    );
  });

  it('accepts a file exactly at the size limit', () => {
    const res = Medium.new({
      ...baseArgs,
      sourceMime: 'image/png',
      size: baseArgs.maxSize,
    });

    expect(Result.isOk(res)).toBe(true);
  });
});
