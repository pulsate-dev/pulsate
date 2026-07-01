import { Result } from '@mikuroxina/mini-fn';

import { NoteAccountSilencedError } from './errors.js';
import type { NoteVisibility } from './note.js';

/**
 * Silenced accounts may still post notes, but not with PUBLIC visibility.
 * Frozen/unapproved accounts are not considered here; that is handled
 * elsewhere (authorization).
 */
export const checkVisibilityForSilencedActor = (
  isSilenced: boolean,
  visibility: NoteVisibility,
): Result.Result<NoteAccountSilencedError, void> => {
  if (isSilenced && visibility === 'PUBLIC') {
    return Result.err(
      new NoteAccountSilencedError(
        'Silenced account cannot set note visibility to PUBLIC',
        { cause: null },
      ),
    );
  }
  return Result.ok(undefined);
};
