import { describe, expect, it } from 'vitest';

import type { AccountID } from '../../accounts/model/account.js';
import { RenoteStatus } from './renoteStatus.js';

describe('RenoteStatus', () => {
  it('create renote status with isRenoted true', () => {
    const actorID = '100' as AccountID;
    const status = RenoteStatus.new(actorID, true);

    expect(status.getActorID()).toBe(actorID);
    expect(status.getIsRenoted()).toBe(true);
  });

  it('create renote status with isRenoted false', () => {
    const actorID = '200' as AccountID;
    const status = RenoteStatus.new(actorID, false);

    expect(status.getActorID()).toBe(actorID);
    expect(status.getIsRenoted()).toBe(false);
  });
});
