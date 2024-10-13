/**
 * Internal Error
 */
export class DriveInternalError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'DriveInternalError';
    this.cause = options.cause;
  }
}

/**
 * Media not found
 */
export class MediaNotFoundError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'MediaNotFoundError';
    this.cause = options.cause;
  }
}

/**
 * Media size is too large
 */
export class MediaSizeTooLargeError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'MediaSizeTooLargeError';
    this.cause = options.cause;
  }
}

export class MediaTypeInvalidError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'MediaTypeInvalidError';
    this.cause = options.cause;
  }
}
