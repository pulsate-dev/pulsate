import type { Option } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../internal/id/type.js';

export type MediumID = ID<Medium>;

export interface CreateMediumArgs {
  id: MediumID;
  name: string;
  authorId: AccountID;
  hash: string;
  mime: string;
  nsfw: boolean;
  // NOTE: Option rather than '' so an undetermined URL cannot be confused with a
  // real empty value, keeping the model always in a valid state.
  url: Option.Option<string>;
  thumbnailUrl: Option.Option<string>;
}

export class Medium {
  private constructor(arg: CreateMediumArgs) {
    this.#id = arg.id;
    this.#name = arg.name;
    this.#authorId = arg.authorId;
    this.#hash = arg.hash;
    this.#mime = arg.mime;
    this.#nsfw = arg.nsfw;
    this.#url = arg.url;
    this.#thumbnailUrl = arg.thumbnailUrl;
  }

  public static new(arg: CreateMediumArgs): Medium {
    return new Medium(arg);
  }

  public static reconstruct(arg: CreateMediumArgs): Medium {
    return new Medium(arg);
  }

  readonly #id: MediumID;
  getId(): MediumID {
    return this.#id;
  }

  readonly #name: string;
  getName(): string {
    return this.#name;
  }

  readonly #authorId: AccountID;
  getAuthorId(): AccountID {
    return this.#authorId;
  }

  readonly #hash: string;
  getHash(): string {
    return this.#hash;
  }

  readonly #mime: string;
  getMime(): string {
    return this.#mime;
  }

  readonly #nsfw: boolean;
  isNsfw(): boolean {
    return this.#nsfw;
  }

  readonly #url: Option.Option<string>;
  getUrl(): Option.Option<string> {
    return this.#url;
  }

  readonly #thumbnailUrl: Option.Option<string>;
  getThumbnailUrl(): Option.Option<string> {
    return this.#thumbnailUrl;
  }
}
