import { Ether, type Option, type Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { Medium, MediumID } from './medium.js';

export interface MediaRepository {
  create(medium: Medium): Promise<Result.Result<Error, void>>;
  findById(id: MediumID): Promise<Option.Option<Medium>>;
  findByAuthor(authorId: AccountID): Promise<Option.Option<Medium[]>>;
}
export const mediaRepoSymbol = Ether.newEtherSymbol<MediaRepository>();
