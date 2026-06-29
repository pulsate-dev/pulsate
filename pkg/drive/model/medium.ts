import { type Option, Result } from '@mikuroxina/mini-fn';
import * as v from 'valibot';

import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../internal/id/type.js';
import { MediaSizeTooLargeError, MediaTypeInvalidError } from './errors.js';

export type MediumID = ID<Medium>;

const ALLOWED_MIME_TYPES = [
  'image/apng',
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/wav',
  'audio/mpeg',
  'audio/ogg',
  'video/webm',
  'video/mp4',
] as const;

const sourceMimeSchema = v.picklist(ALLOWED_MIME_TYPES);

export interface CreateMediumArgs {
  id: MediumID;
  name: string;
  authorId: AccountID;
  hash: string;
  mime: string;
  nsfw: boolean;
  url: Option.Option<string>;
  thumbnailUrl: Option.Option<string>;
}

export interface NewMediumArgs extends CreateMediumArgs {
  sourceMime: string;
  size: number;
  maxSize: number;
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

  public static new(
    arg: NewMediumArgs,
  ): Result.Result<MediaSizeTooLargeError | MediaTypeInvalidError, Medium> {
    if (!v.safeParse(sourceMimeSchema, arg.sourceMime).success) {
      return Result.err(
        new MediaTypeInvalidError('Invalid file type', { cause: null }),
      );
    }
    // NOTE: maxSize is provided per call, so the size schema is built here.
    const sizeSchema = v.pipe(v.number(), v.maxValue(arg.maxSize));
    if (!v.safeParse(sizeSchema, arg.size).success) {
      return Result.err(
        new MediaSizeTooLargeError('File size is too large', { cause: null }),
      );
    }
    return Result.ok(new Medium(arg));
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
