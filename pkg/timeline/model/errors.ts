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
