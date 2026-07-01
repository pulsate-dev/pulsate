import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import { checkVisibilityForSilencedActor } from './createDomainService.js';
import { NoteAccountSilencedError } from './errors.js';

describe('checkVisibilityForSilencedActor', () => {
  it('rejects PUBLIC visibility for a silenced actor', () => {
    const res = checkVisibilityForSilencedActor(true, 'PUBLIC');
    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(NoteAccountSilencedError);
  });

  it.each([
    'HOME',
    'FOLLOWERS',
    'DIRECT',
  ] as const)('allows %s visibility for a silenced actor', (visibility) => {
    const res = checkVisibilityForSilencedActor(true, visibility);
    expect(Result.isOk(res)).toBe(true);
  });

  it.each([
    'PUBLIC',
    'HOME',
    'FOLLOWERS',
    'DIRECT',
  ] as const)('allows %s visibility for a non-silenced actor', (visibility) => {
    const res = checkVisibilityForSilencedActor(false, visibility);
    expect(Result.isOk(res)).toBe(true);
  });
});
