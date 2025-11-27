import type { AccountID } from '../../accounts/model/account.js';

export class RenoteStatus {
  private constructor(
    private readonly actorID: AccountID,
    private readonly isRenoted: boolean,
  ) {}

  static new(actorID: AccountID, isRenoted: boolean) {
    return new RenoteStatus(actorID, isRenoted);
  }

  getActorID(): AccountID {
    return this.actorID;
  }

  getIsRenoted(): boolean {
    return this.isRenoted;
  }
}
