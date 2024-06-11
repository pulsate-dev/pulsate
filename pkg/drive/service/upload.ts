import { Option, Result } from '@mikuroxina/mini-fn';
import { encode } from 'blurhash';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';

import type { AccountID } from '../../accounts/model/account.js';
import type { SnowflakeIDGenerator } from '../../id/mod.js';
import type { ID } from '../../id/type.js';
import { Medium, type MediumID } from '../model/medium.js';
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
    authorId: ID<AccountID>;
    nsfw: boolean;
    file: Uint8Array;
  }): Promise<Result.Result<Error, Medium>> {
    const mime = await this.detectFileType(args.file);
    if (Option.isNone(mime)) {
      return Result.err(new Error('Invalid file type'));
    }
    if (args.file.length > this.MAX_MEDIA_SIZE) {
      return Result.err(new Error('File size is too large'));
    }

    const processed = await this.imageProcessing(args.file);
    if (Option.isNone(processed)) {
      return Result.err(new Error('Failed to process image'));
    }

    const id = this.idGenerator.generate<MediumID>();

    if (Result.isErr(id)) {
      return id;
    }

    await this.storage.upload(`${id[1]}.webp`, processed[1].resized);
    await this.storage.upload(
      `thumbnail-${id[1]}.webp`,
      processed[1].thumbnail,
    );

    const medium = Medium.new({
      id: id[1] as ID<(typeof id)[1]>,
      name: args.name,
      authorId: args.authorId,
      nsfw: args.nsfw,
      mime: 'image/webp',
      hash: processed[1].hash,
      url: '',
      thumbnailUrl: '',
    });
    console.log(medium);

    const res = await this.repository.create(medium);
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(medium);
  }

  private async detectFileType(
    file: Uint8Array,
  ): Promise<Option.Option<string>> {
    const detected = await fileTypeFromBuffer(file);
    if (!detected) {
      return Option.none();
    }

    const allowedTypes = [
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
    ];
    if (!allowedTypes.includes(detected.mime)) {
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

    const webp = await sharp(file).webp().toBuffer();
    const resized = await sharp(webp).toBuffer();
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
  }
}
