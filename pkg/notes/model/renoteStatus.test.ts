import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import type { NoteID } from './note.js';
import { RenoteStatus } from './renoteStatus.js';

describe('RenoteStatus', () => {
  it('create renote status with isRenoted true', () => {
    const actorId = '100' as AccountID;
    const noteId = '500' as NoteID;
    const status = RenoteStatus.new(actorId, noteId, true);

    expect(status.getActorID()).toBe(actorId);
    expect(status.getNoteID()).toBe(noteId);
    expect(status.getIsRenoted()).toBe(true);
  });

  it('create renote status with isRenoted false', () => {
    const actorId = '200' as AccountID;
    const noteId = '500' as NoteID;
    const status = RenoteStatus.new(actorId, noteId, false);

    expect(status.getActorID()).toBe(actorId);
    expect(status.getNoteID()).toBe(noteId);
    expect(status.getIsRenoted()).toBe(false);
  });
});
