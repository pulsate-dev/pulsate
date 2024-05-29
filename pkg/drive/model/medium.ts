import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';

export type MediumID = string;

export interface CreateMediumArgs {
  id: ID<MediumID>;
  name: string;
  authorID: ID<AccountID>;
  hash: string;
  mime: string;
  nsfw: boolean;
  url: string;
  thumbnailURL: string;
}

export class Medium {
  private constructor(arg: CreateMediumArgs) {
    this.id = arg.id;
    this.name = arg.name;
    this.authorID = arg.authorID;
    this.hash = arg.hash;
    this.mime = arg.mime;
    this.nsfw = arg.nsfw;
    this.url = arg.url;
    this.thumbnailURL = arg.thumbnailURL;
  }

  public static new(arg: CreateMediumArgs): Medium {
    return new Medium(arg);
  }

  public static reconstruct(arg: CreateMediumArgs): Medium {
    return new Medium(arg);
  }

  private readonly id: ID<MediumID>;

  getID(): ID<MediumID> {
    return this.id;
  }
  private readonly name: string;

  getName(): string {
    return this.name;
  }
  private readonly authorID: ID<AccountID>;

  getAuthorID(): ID<AccountID> {
    return this.authorID;
  }
  private readonly hash: string;

  getHash(): string {
    return this.hash;
  }
  private readonly mime: string;

  getMime(): string {
    return this.mime;
  }
  private readonly nsfw: boolean;

  isNSFW(): boolean {
    return this.nsfw;
  }
  private readonly url: string;

  getURL(): string {
    return this.url;
  }
  private readonly thumbnailURL: string;

  getThumbnailURL(): string {
    return this.thumbnailURL;
  }
}
