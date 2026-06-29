import { Option, Result } from '@mikuroxina/mini-fn';
import { encode } from 'blurhash';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';

import type { AccountID } from '../../accounts/model/account.js';
import type { SnowflakeIDGenerator } from '../../internal/id/mod.js';
import { DriveInternalError, MediaTypeInvalidError } from '../model/errors.js';
import { Medium } from '../model/medium.js';
import type { MediaRepository } from '../model/repository.js';
import type { Storage } from '../model/storage.js';

export class UploadMediaService {
  constructor(
    private readonly idGenerator: SnowflakeIDGenerator,
    private readonly repository: MediaRepository,
    private readonly storage: Storage,
    private readonly MAX_MEDIA_SIZE: number,
  ) {}

  /**
   * @description Specification:
   *  1. files must be less than MAX_MEDIA_SIZE
   *  2. files must be in the following formats: apng, avif, gif, jpeg, png, webp, wav, mp3, ogg, webm, mp4
   *  3. images must be transformed to webp
   *  4. images must be resized and thumbnails must be generated
   */
  async handle(args: {
    name: string;
    authorId: AccountID;
    nsfw: boolean;
    file: Uint8Array;
  }): Promise<Result.Result<Error, Medium>> {
    const mime = await this.detectFileType(args.file);
    if (Option.isNone(mime)) {
      return Result.err(
        new MediaTypeInvalidError('Invalid file type', { cause: null }),
      );
    }

    const id = this.idGenerator.generate<Medium>();
    if (Result.isErr(id)) {
      return id;
    }

    // NOTE: Processing runs first because the hash comes from it. If it fails
    // the empty hash is harmless: an invalid source is rejected by Medium.new,
    // and a valid source is reported as an internal error below.
    const processed = await this.imageProcessing(args.file);

    const medium = Medium.new({
      id: id[1],
      name: args.name,
      authorId: args.authorId,
      nsfw: args.nsfw,
      mime: 'image/webp',
      hash: Option.isSome(processed) ? processed[1].hash : '',
      url: Option.none(),
      thumbnailUrl: Option.none(),
      sourceMime: mime[1],
      size: args.file.length,
      maxSize: this.MAX_MEDIA_SIZE,
    });
    if (Result.isErr(medium)) {
      return medium;
    }

    // NOTE: The source is valid, so a failed processing is an internal error.
    if (Option.isNone(processed)) {
      return Result.err(
        new DriveInternalError('Failed to process image', { cause: null }),
      );
    }

    await this.storage.upload(`${id[1]}.webp`, processed[1].resized);
    await this.storage.upload(
      `thumbnail-${id[1]}.webp`,
      processed[1].thumbnail,
    );

    const res = await this.repository.create(medium[1]);
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(medium[1]);
  }

  private async detectFileType(
    file: Uint8Array,
  ): Promise<Option.Option<string>> {
    const detected = await fileTypeFromBuffer(file);
    if (!detected) {
      return Option.none();
    }
    return Option.some(detected.mime);
  }

  private async imageProcessing(
    file: Uint8Array,
  ): Promise<
    Option.Option<{ resized: Uint8Array; thumbnail: Uint8Array; hash: string }>
  > {
    // ToDo: separate cases when images are animated

    // NOTE: sharp throws on unsupported or corrupt inputs; treat that as a
    // failed processing so the caller can decide the resulting error.
    try {
      const resized = await sharp(file).webp().toBuffer();
      const thumbnail = await sharp(resized).resize(200, 200).toBuffer();

      const { data, info } = await sharp(thumbnail)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const hash = encode(
        new Uint8ClampedArray(data),
        info.width,
        info.height,
        4,
        4,
      );
      return Option.some({ resized, thumbnail, hash: hash });
    } catch {
      return Option.none();
    }
  }
}
