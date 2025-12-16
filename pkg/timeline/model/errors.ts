/**
 * Internal Error
 */
export class TimelineInternalError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'TimelineInternalError';
    this.cause = options.cause;
  }
}

/**
 * Error when trying to retrieve timeline of a blocked account.
 */
export class TimelineBlockedByAccountError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'TimelineBlockedByAccountError';
    this.cause = options.cause;
  }
}

/**
 * Error when timeline is retrieved, but no more notes exist.
 */
export class TimelineNoMoreNotesError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'TimelineNoMoreNotesError';
    this.cause = options.cause;
  }
}

/**
 * List title too long
 */
export class ListTitleTooLongError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'ListTitleTooLongError';
    this.cause = options.cause;
  }
}

/**
 * List not found
 */
export class ListNotFoundError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'ListNotFoundError';
    this.cause = options.cause;
  }
}

/**
 * Too many List members
 */
export class ListTooManyMembersError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'ListTooManyMembersError';
    this.cause = options.cause;
  }
}

/**
 * beforeID and afterID specified at the same time
 */
export class TimelineInvalidFilterRangeError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'TimelineInvalidFilterRangeError';
    this.cause = options.cause;
  }
}

/**
 * Too many target accounts
 */
export class ListTooManyTargetsError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'ListTooManyTargetsError';
    this.cause = options.cause;
  }
}

/**
 * Internal Error
 */
export class ListInternalError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'ListInternalError';
    this.cause = options.cause;
  }
}

/**
 * Account don't have permission to do this action
 */
export class TimelineInsufficientPermissionError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'TimelineInsufficientPermissionError';
    this.cause = options.cause;
  }
}

/**
 * Timeline cache key not found
 */
export class TimelineCacheNotFoundError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'TimelineCacheNotFoundError';
    this.cause = options.cause;
  }
}
