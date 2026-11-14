import { describe, expect, it } from 'vitest';
import { compareID } from '../../internal/id/mod.ts';
import { generateDummyNote, generateDummyNotes } from './testData.ts';

describe('generateDummyNote', () => {
  it('generates distinct public notes without arguments', () => {
    const a = generateDummyNote();
    const b = generateDummyNote();

    expect(a.getID()).not.toBe(b.getID());
    expect(a.getVisibility()).toBe('PUBLIC');
  });
});

describe('generateDummyNotes', () => {
  it('generates notes in ascending order of creation', () => {
    const notes = generateDummyNotes(3);
    const ids = notes.map((n) => n.getID());

    expect(notes).toHaveLength(3);
    expect([...ids].sort(compareID).reverse()).toStrictEqual(ids);
  });

  it('applies per-index overrides', () => {
    const notes = generateDummyNotes(2, (i) => ({ content: `note ${i}` }));

    expect(notes.map((n) => n.getContent())).toStrictEqual([
      'note 0',
      'note 1',
    ]);
  });
});
