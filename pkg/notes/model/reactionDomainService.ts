import { Option } from '@mikuroxina/mini-fn';

import type { Note, NoteID } from './note.ts';

/**
 * Reactions on a pure renote (not a quote) are attributed to the original
 * note, since the renote itself carries no content of its own.
 */
export const getReactionRedirectTargetID = (
  note: Note,
): Option.Option<NoteID> => {
  const targetID = note.getReactionTargetNoteID();
  if (targetID === note.getID()) {
    return Option.none();
  }
  return Option.some(targetID);
};
