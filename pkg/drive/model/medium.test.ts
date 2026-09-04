import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.ts';
import { MediaSizeTooLargeError, MediaTypeInvalidError } from './errors.ts';
import { Medium, type MediumID } from './medium.ts';

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
    const res = Medium.new(
      { ...baseArgs, sourceMime: 'image/png' },
      baseArgs.authorId,
    );

    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res).getMime()).toBe('image/webp');
  });

  it('rejects a disallowed source MIME type', () => {
    const res = Medium.new(
      { ...baseArgs, sourceMime: 'image/heic' },
      baseArgs.authorId,
    );

    expect(Result.isErr(res)).toBe(true);
    expect(res[1]).toStrictEqual(
      new MediaTypeInvalidError('Invalid file type', { cause: null }),
    );
  });

  it('rejects a file larger than the limit', () => {
    const res = Medium.new(
      {
        ...baseArgs,
        sourceMime: 'image/png',
        size: baseArgs.maxSize + 1,
      },
      baseArgs.authorId,
    );

    expect(Result.isErr(res)).toBe(true);
    expect(res[1]).toStrictEqual(
      new MediaSizeTooLargeError('File size is too large', { cause: null }),
    );
  });

  it('accepts a file exactly at the size limit', () => {
    const res = Medium.new(
      {
        ...baseArgs,
        sourceMime: 'image/png',
        size: baseArgs.maxSize,
      },
      baseArgs.authorId,
    );

    expect(Result.isOk(res)).toBe(true);
  });
});

describe('Medium.new events', () => {
  it('emits a medium.created event on success', () => {
    const res = Medium.new(
      { ...baseArgs, sourceMime: 'image/png' },
      baseArgs.authorId,
    );

    const medium = Result.unwrap(res);
    const events = medium.pullEvents();
    expect(events).toHaveLength(1);
    const [event] = events;
    expect(event?.eventName).toBe('medium.created');
    expect(event?.target).toBe(baseArgs.id);
    expect(event?.actor).toBe(baseArgs.authorId);
  });

  it.each([
    ['disallowed source MIME type', { sourceMime: 'image/heic' }],
    [
      'file larger than the limit',
      { sourceMime: 'image/png', size: baseArgs.maxSize + 1 },
    ],
  ])('does not emit an event when validation fails: %s', (_, override) => {
    const res = Medium.new({ ...baseArgs, ...override }, baseArgs.authorId);

    expect(Result.isErr(res)).toBe(true);
  });

  it('pullEvents() removes events, returning nothing on the second call', () => {
    const res = Medium.new(
      { ...baseArgs, sourceMime: 'image/png' },
      baseArgs.authorId,
    );
    const medium = Result.unwrap(res);

    expect(medium.pullEvents()).toHaveLength(1);
    expect(medium.pullEvents()).toHaveLength(0);
  });
});
