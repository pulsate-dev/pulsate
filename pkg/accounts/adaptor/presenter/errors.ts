import { z } from '@hono/zod-openapi';

export const InternalError = z.literal('INTERNAL_ERROR').openapi({
  description: 'Internal server error.',
});

export const InvalidAccountName = z.literal('INVALID_ACCOUNT_NAME').openapi({
  description: 'Account name is invalid.',
});
export const TooLongAccountName = z.literal('TOO_LONG_ACCOUNT_NAME').openapi({
  description: 'Account name is too long.',
});
export const EMailInUse = z.literal('EMAIL_IN_USE').openapi({
  description: 'Account email is already in use.',
});
export const YouAreBot = z.literal('YOU_ARE_BOT').openapi({
  description: 'CAPTCHA verification failed.',
});
export const AccountNameInUse = z.literal('ACCOUNT_NAME_IN_USE').openapi({
  description: 'Account name is already in use.',
});
export const InvalidSequence = z.literal('INVALID_SEQUENCE').openapi({
  description: 'Contains unusable character types in parameters.',
});
export const VulnerablePassphrase = z.literal('VULNERABLE_PASSPHRASE').openapi({
  description: 'Passphrase is too weak.',
});
export const AccountNotFound = z.literal('ACCOUNT_NOT_FOUND').openapi({
  description: 'Account not found.',
});
export const InvalidETag = z.literal('INVALID_ETAG').openapi({
  description: 'ETag is invalid.',
});
export const AlreadyFrozen = z.literal('ALREADY_FROZEN').openapi({
  description: 'Account is already frozen.',
});
export const NoPermission = z.literal('NO_PERMISSION').openapi({
  description: "You can't do this action.",
});
export const AccountAlreadyVerified = z
  .literal('ACCOUNT_ALREADY_VERIFIED')
  .openapi({
    description: 'Account email address is already verified.',
  });
export const InvalidAccessToken = z.literal('INVALID_TOKEN').openapi({
  description: 'Access token is invalid.',
});
export const FailedToLogin = z.literal('FAILED_TO_LOGIN').openapi({
  description: 'Failed to login. Passphrase or Account Name is invalid.',
});
export const YouAreFrozen = z.literal('YOU_ARE_FROZEN').openapi({
  description: "Your account is frozen, you can't login.",
});
export const InvalidRefreshToken = z.literal('INVALID_TOKEN').openapi({
  description: 'Refresh token is invalid.',
});
export const InvalidEMailVerifyToken = z.literal('INVALID_TOKEN').openapi({
  description: 'EMail verification token is invalid.',
});
export const ExpiredToken = z.literal('EXPIRED_TOKEN').openapi({
  description: 'Refresh or Access token is expired. Please re-login.',
});
export const AlreadyFollowing = z.literal('ALREADY_FOLLOWING').openapi({
  description: 'You are already following this account.',
});
export const YouAreBlocked = z.literal('YOU_ARE_BLOCKED').openapi({
  description: 'You are blocked by this account.',
});
export const YouAreNotFollowing = z.literal('YOU_ARE_NOT_FOLLOWING').openapi({
  description: 'You are not following this account.',
});
