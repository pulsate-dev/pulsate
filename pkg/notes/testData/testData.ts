import { Option } from '@mikuroxina/mini-fn';
import type { Account } from '../../accounts/model/account.ts';
import { DUMMY_BASE_DATE, generateDummyID } from '../../internal/id/dummy.ts';
import { addDuration } from '../../internal/time/mod.ts';
import { type CreateNoteArgs, Note } from '../model/note.ts';
import { Reaction } from '../model/reaction.ts';

type ReconstructReactionArgs = Parameters<typeof Reaction.reconstruct>[0];

/**
 * @description generate dummy public note (factory function)
 * @param overrides fields to override the default dummy values
 * @returns {@link Note}
 */
export const generateDummyNote = (
  overrides: Partial<CreateNoteArgs> = {},
): Note => {
  const createdAt = overrides.createdAt ?? DUMMY_BASE_DATE;
  return Note.reconstruct({
    id: generateDummyID<Note>(createdAt),
    authorID: generateDummyID<Account>(createdAt),
    content: 'this is test note',
    visibility: 'PUBLIC',
    contentsWarningComment: '',
    sendTo: Option.none(),
    originalNoteID: Option.none(),
    attachmentFileID: [],
    updatedAt: Option.none(),
    deletedAt: Option.none(),
    ...overrides,
    createdAt,
  });
};

/**
 * @description generate dummy notes posted one second apart in ascending order
 * @param count number of notes
 * @param overrides fields to override for the `index`-th note
 */
export const generateDummyNotes = (
  count: number,
  overrides: (index: number) => Partial<CreateNoteArgs> = () => ({}),
): Note[] =>
  Array.from({ length: count }, (_, index) =>
    generateDummyNote({
      createdAt: addDuration(DUMMY_BASE_DATE, { seconds: index }),
      ...overrides(index),
    }),
  );

/**
 * @description generate dummy reaction (factory function)
 * @param args reactor/target note and fields to override the default dummy values
 * @returns {@link Reaction}
 */
export const generateDummyReaction = (
  args: Pick<ReconstructReactionArgs, 'accountID' | 'noteID'> &
    Partial<ReconstructReactionArgs>,
): Reaction =>
  Reaction.reconstruct({
    id: generateDummyID<Reaction>(DUMMY_BASE_DATE),
    body: '👍',
    ...args,
  });
