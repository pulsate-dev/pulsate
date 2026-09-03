import { Cat, Option, Promise, Result } from '@mikuroxina/mini-fn';
import { encode } from 'blurhash';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';

import type { AccountID } from '../../accounts/model/account.ts';
import type { Clock, SnowflakeIDGenerator } from '../../internal/id/mod.ts';
import { DriveInternalError, MediaTypeInvalidError } from '../model/errors.ts';
import { Medium } from '../model/medium.ts';
import type { MediaRepository } from '../model/repository.ts';
import type { Storage } from '../model/storage.ts';

type ProcessedImage = {
  resized: Uint8Array;
  thumbnail: Uint8Array;
  hash: string;
};

export class UploadMediaService {
  readonly #idGenerator: SnowflakeIDGenerator;
  readonly #repository: MediaRepository;
  readonly #storage: Storage;
  readonly #MAX_MEDIA_SIZE: number;
  readonly #clock: Clock;
  constructor(
    idGenerator: SnowflakeIDGenerator,
    repository: MediaRepository,
    storage: Storage,
    MAX_MEDIA_SIZE: number,
    clock: Clock,
  ) {
    this.#idGenerator = idGenerator;
    this.#repository = repository;
    this.#storage = storage;
    this.#MAX_MEDIA_SIZE = MAX_MEDIA_SIZE;
    this.#clock = clock;
  }

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
    const monad = Promise.resultMonad<Error>();
    const invalidType = () =>
      new MediaTypeInvalidError('Invalid file type', { cause: null });

    return (
      Cat.doT(monad)
        .addM(
          'mime',
          this.detectFileType(args.file).then(Option.okOrElse(invalidType)),
        )
        .addM('id', Promise.resolve(this.#idGenerator.generate<Medium>()))
        // NOTE: imageProcessing runs before size validation, but the hash it
        // produces is only used by Medium.new. When processing fails, the empty
        // hash is harmless: an invalid source is rejected by Medium.new, and a
        // valid source is reported as an internal error below.
        .addM(
          'processed',
          this.imageProcessing(args.file).then((opt) =>
            Result.ok<Option.Option<ProcessedImage>>(opt),
          ),
        )
        .addMWith('medium', ({ id, mime, processed }) =>
          Promise.resolve(
            Medium.new(
              {
                id,
                name: args.name,
                authorId: args.authorId,
                nsfw: args.nsfw,
                mime: 'image/webp',
                hash: Option.unwrapOr('')(
                  Option.map((p: ProcessedImage) => p.hash)(processed),
                ),
                url: Option.none(),
                thumbnailUrl: Option.none(),
                sourceMime: mime,
                size: args.file.length,
                maxSize: this.#MAX_MEDIA_SIZE,
              },
              {
                idGenerator: this.#idGenerator,
                actor: args.authorId,
                occurredAt: new Date(Number(this.#clock.now())),
              },
            ),
          ),
        )
        // NOTE: The source is valid, so a failed processing is an internal error.
        .when(
          ({ processed }) => Option.isNone(processed),
          () =>
            Promise.resolve(
              Result.err(
                new DriveInternalError('Failed to process image', {
                  cause: null,
                }),
              ),
            ),
        )
        .runWith(({ id, processed }) =>
          this.#storage
            .upload(`${id}.webp`, Option.unwrap(processed).resized)
            .then(() => Result.ok([])),
        )
        .runWith(({ id, processed }) =>
          this.#storage
            .upload(`thumbnail-${id}.webp`, Option.unwrap(processed).thumbnail)
            .then(() => Result.ok([])),
        )
        .addMWith('result', ({ medium }) => this.#repository.create(medium))
        .finish(({ result }) => result)
    );
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
  ): Promise<Option.Option<ProcessedImage>> {
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
