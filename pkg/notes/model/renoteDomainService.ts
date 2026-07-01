import { Option } from '@mikuroxina/mini-fn';

import type { Note, NoteID } from './note.js';

/**
 * Decides which Note a renote/quote targeting {@link note} should ultimately
 * reference as its `originalNoteID`.
 *
 * - Pure renote (renote of renote, a "chain"): follow one hop to the target's
 *   original. Renoting a renote refers to the root, not the intermediate
 *   renote.
 * - Quote: do NOT follow the chain. Renoting a quote refers to the quote
 *   itself, not the root that the quote references.
 * - Ordinary note: the note itself is the reference target.
 *
 * Returns `Some(nextID)` when the caller must additionally fetch `nextID`
 * to get the resolved original (pure-renote chain), or `None` when `note`
 * itself is the resolved target.
 */
export const getRenoteChainRootID = (note: Note): Option.Option<NoteID> => {
  if (note.isRenote() && !note.isQuote()) {
    return note.getOriginalNoteID();
  }
  return Option.none();
};
