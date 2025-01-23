/*
Error naming convention:
(Model or Service Name) +
((adverb or prototype of verb) or 3rd-person-singular-present-tense or past participle) +
noun phrase +
Error
*/

/**
 * Internal Error
 */
export class AccountInternalError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'AccountInternalError';
    this.cause = options.cause;
  }
}

/**
 * Account don't have permission to do this action
 */
export class AccountInsufficientPermissionError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'AccountInsufficientPermissionError';
    this.cause = options.cause;
  }
}

/**
 * Account is frozen.
 */
export class AccountLoginRejectedError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'AccountLoginRejectedError';
    this.cause = options.cause;
  }
}

/**
 * Account not found
 */
export class AccountNotFoundError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'AccountNotFoundError';
    this.cause = options.cause;
  }
}

/**
 * Account mail address is already in use
 */
export class AccountMailAddressAlreadyInUseError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'AccountMailAddressAlreadyInUseError';
    this.cause = options.cause;
  }
}

/**
 * Account name is already in use
 */
export class AccountNameAlreadyInUseError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = '';
    this.cause = options.cause;
  }
}

/**
 * Account name is too long
 */
export class AccountNameTooLongError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = '';
    this.cause = options.cause;
  }
}

/**
 * Account Nickname is too short
 */
export class AccountNicknameTooShortError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'AccountNicknameTooShortError';
    this.cause = options.cause;
  }
}

/**
 * Account nickname is too long
 */
export class AccountNicknameTooLongError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'AccountNicknameTooLongError';
    this.cause = options.cause;
  }
}

/**
 * Account mail address length out of range
 */
export class AccountMailAddressLengthError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'AccountMailAddressLengthError';
    this.cause = options.cause;
  }
}

/**
 * Account name's character sequence is invalid
 */
export class AccountNameInvalidUsageError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = '';
    this.cause = options.cause;
  }
}

/**
 * CAPTCHA verification failed
 */
export class AccountCaptchaTokenInvalidError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = '';
    this.cause = options.cause;
  }
}

/**
 * Account passphrase is too weak
 */
export class AccountPassphraseRequirementsNotMetError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = '';
    this.cause = options.cause;
  }
}

/**
 * Failed to log in
 */
export class AccountAuthenticationFailedError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = '';
    this.cause = options.cause;
  }
}

/**
 * Account mail address is already verified
 */
export class AccountMailAddressAlreadyVerifiedError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = '';
    this.cause = options.cause;
  }
}

/**
 * Account mail address verification token is invalid
 */
export class AccountMailAddressVerificationTokenInvalidError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = '';
    this.cause = options.cause;
  }
}

/**
 * Authentication token is invalid
 */
export class AccountAuthenticationTokenInvalidError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'AccountAuthenticationTokenInvalidError';
    this.cause = options.cause;
  }
}

/**
 * Authentication token is expired
 */
export class AccountAuthenticationTokenExpiredError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'AccountAuthenticationTokenExpiredError';
    this.cause = options.cause;
  }
}

/**
 * Refresh token is invalid
 */
export class AccountRefreshTokenInvalidError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = '';
    this.cause = options.cause;
  }
}

/**
 * Refresh token is expired
 */
export class AccountRefreshTokenExpiredError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = '';
    this.cause = options.cause;
  }
}

/**
 * Specified account is already frozen
 */
export class AccountAlreadyFrozenError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = '';
    this.cause = options.cause;
  }
}

/**
 * Account info updating ETag is invalid
 */
export class AccountUpdateETagInvalidError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = '';
    this.cause = options.cause;
  }
}

/**
 * Blocked by the account try to follow
 */
export class AccountFollowingBlockedError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'AccountFollowingBlockedError';
    this.cause = options.cause;
  }
}

/**
 * Account is already following
 */
export class AccountAlreadyFollowingError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'AccountAlreadyFollowingError';
    this.cause = options.cause;
  }
}

/**
 * Account is not following
 */
export class AccountNotFollowingError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'AccountNotFollowingError';
    this.cause = options.cause;
  }
}
