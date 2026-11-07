import { describe, expect, it } from 'vitest';

import type { Account } from '../../accounts/model/account.ts';
import { generateDummyID } from '../../internal/id/dummy.ts';
import type { Note } from './note.ts';
import { RenoteStatus } from './renoteStatus.ts';

describe('RenoteStatus', () => {
  it('create renote status with isRenoted true', () => {
    const actorId = generateDummyID<Account>();
    const noteId = generateDummyID<Note>();
    const status = RenoteStatus.new(actorId, noteId, true);

    expect(status.getActorID()).toBe(actorId);
    expect(status.getNoteID()).toBe(noteId);
    expect(status.getIsRenoted()).toBe(true);
  });

  it('create renote status with isRenoted false', () => {
    const actorId = generateDummyID<Account>();
    const noteId = generateDummyID<Note>();
    const status = RenoteStatus.new(actorId, noteId, false);

    expect(status.getActorID()).toBe(actorId);
    expect(status.getNoteID()).toBe(noteId);
    expect(status.getIsRenoted()).toBe(false);
  });
});
