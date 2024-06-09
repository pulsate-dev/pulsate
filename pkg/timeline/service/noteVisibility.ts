import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import { type AccountModule } from '../../intermodule/account.js';
import type { Note } from '../../notes/model/note.js';

export interface NoteVisibilityCheckArgs {
  // account id of the user who is trying to see the note
  accountID: ID<AccountID>;
  note: Note;
}

export class NoteVisibilityService {
  constructor(private readonly accountModule: AccountModule) {}

  public async handle(args: NoteVisibilityCheckArgs): Promise<boolean> {
    if (args.accountID === args.note.getAuthorID()) {
      return true;
    }
    if (args.note.getVisibility() === 'PUBLIC') {
      return true;
    }
    if (args.note.getVisibility() === 'HOME') {
      return true;
    }
    if (args.note.getVisibility() === 'DIRECT') {
      if (Option.unwrapOr('')(args.note.getSendTo()) === args.accountID) {
        return true;
      }
    }
    if (args.note.getVisibility() === 'FOLLOWERS') {
      const followers = await this.accountModule.fetchFollowers(args.accountID);
      if (Result.isErr(followers)) {
        return false;
      }
      for (const v of followers[1]) {
        if (v.getID() === args.accountID) {
          return true;
        }
      }
    }

    return false;
  }
}
export const noteVisibilitySymbol =
  Ether.newEtherSymbol<NoteVisibilityService>();
export const noteVisibility = Ether.newEther(
  noteVisibilitySymbol,
  ({ accountModule }) => new NoteVisibilityService(accountModule),
  {
    accountModule: Ether.newEtherSymbol<AccountModule>(),
  },
);
