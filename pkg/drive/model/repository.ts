import { Ether, type Option, type Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import type { Medium, MediumID } from './medium.js';

export interface MediaRepository {
  create(medium: Medium): Promise<Result.Result<Error, void>>;
  findByID(id: ID<MediumID>): Promise<Option.Option<Medium>>;
  findByAuthor(authorID: ID<AccountID>): Promise<Option.Option<Medium[]>>;
}
export const mediaRepoSymbol = Ether.newEtherSymbol<MediaRepository>();
