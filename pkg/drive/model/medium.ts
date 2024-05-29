import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';

export type MediumID = string;

export interface CreateMediumArgs {
  id: ID<MediumID>;
  name: string;
  authorId: ID<AccountID>;
  hash: string;
  mime: string;
  nsfw: boolean;
  url: string;
  thumbnailUrl: string;
}

export class Medium {
  private constructor(arg: CreateMediumArgs) {
    this.id = arg.id;
    this.name = arg.name;
    this.authorId = arg.authorId;
    this.hash = arg.hash;
    this.mime = arg.mime;
    this.nsfw = arg.nsfw;
    this.url = arg.url;
    this.thumbnailUrl = arg.thumbnailUrl;
  }

  public static new(arg: CreateMediumArgs): Medium {
    return new Medium(arg);
  }

  public static reconstruct(arg: CreateMediumArgs): Medium {
    return new Medium(arg);
  }

  private readonly id: ID<MediumID>;

  getId(): ID<MediumID> {
    return this.id;
  }
  private readonly name: string;

  getName(): string {
    return this.name;
  }
  private readonly authorId: ID<AccountID>;

  getAuthorId(): ID<AccountID> {
    return this.authorId;
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

  isNsfw(): boolean {
    return this.nsfw;
  }
  private readonly url: string;

  getUrl(): string {
    return this.url;
  }
  private readonly thumbnailUrl: string;

  getThumbnailUrl(): string {
    return this.thumbnailUrl;
  }
}
