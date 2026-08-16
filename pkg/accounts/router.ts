import { createRoute, z } from '@hono/zod-openapi';

import { FileNotFound } from '../drive/adaptor/presenter/errors.ts';
import {
  bearerAuth,
  errorResponse,
  internalErrorResponse,
  jsonBody,
  noContentResponse,
  okResponse,
} from '../internal/router/helper.ts';
import {
  AccountAlreadyVerified,
  AccountNameInUse,
  AccountNotFound,
  AlreadyFollowing,
  AlreadyFrozen,
  EMailInUse,
  ExpiredToken,
  FailedToLogin,
  InternalError,
  InvalidAccountName,
  InvalidEMailVerifyToken,
  InvalidRefreshToken,
  InvalidSequence,
  NoPermission,
  TooLongAccountName,
  VulnerablePassphrase,
  YouAreBlocked,
  YouAreBot,
  YouAreFrozen,
  YouAreNotFollowing,
} from './adaptor/presenter/errors.ts';
import {
  CreateAccountRequestSchema,
  CreateAccountResponseSchema,
  GetAccountFollowingSchema,
  GetAccountRelationshipsResponseSchema,
  GetAccountResponseSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  RefreshResponseSchema,
  ResendVerificationEmailRequestSchema,
  SetAccountAvatarRequestSchema,
  UpdateAccountRequestSchema,
  UpdateAccountResponseSchema,
  VerifyEmailRequestSchema,
} from './adaptor/validator/schema.ts';

const accountInternalErrorSchema = z
  .object({ error: InternalError })
  .openapi('InternalErrorResponse');

const accountNameParams = () =>
  z.object({
    name: z.string().min(3).max(64).openapi({
      example: 'example_man',
      description:
        'Characters must be [A-Za-z0-9-.] The first and last characters must be [A-Za-z0-9-.]',
    }),
  });

export const CreateAccountRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/v0/accounts',
  request: {
    body: jsonBody(CreateAccountRequestSchema),
  },
  responses: {
    200: okResponse(CreateAccountResponseSchema),
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: z.object({
            error: z
              .union([InvalidAccountName, TooLongAccountName, YouAreBot])
              .openapi({
                example: 'INVALID_ACCOUNT_NAME',
                description: 'Error codes',
              }),
          }),
        },
      },
    },
    409: {
      description: 'Conflict',
      content: {
        'application/json': {
          schema: z.object({
            error: z.union([EMailInUse, AccountNameInUse]).openapi({
              example: 'ACCOUNT_NAME_IN_USE',
              description: 'Error codes',
            }),
          }),
        },
      },
    },
    500: internalErrorResponse(accountInternalErrorSchema),
  },
});

export const UpdateAccountRoute = createRoute({
  method: 'patch',
  tags: ['accounts'],
  path: '/v0/accounts/:name',
  security: bearerAuth(),
  request: {
    params: accountNameParams(),
    body: jsonBody(UpdateAccountRequestSchema),
  },
  responses: {
    200: okResponse(UpdateAccountResponseSchema),
    202: {
      description: 'When email updated',
      content: {
        'application/json': {
          schema: UpdateAccountResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: z.object({
            error: z
              .union([InvalidSequence, VulnerablePassphrase])
              .openapi({ description: 'error codes' }),
          }),
        },
      },
    },
    404: errorResponse('Not Found', AccountNotFound, 'account not found'),
    500: internalErrorResponse(accountInternalErrorSchema),
  },
});

export const FreezeAccountRoute = createRoute({
  method: 'put',
  tags: ['accounts'],
  path: '/v0/accounts/:name/freeze',
  security: bearerAuth(),
  request: {
    params: accountNameParams(),
  },
  responses: {
    204: noContentResponse('No Content'),
    400: errorResponse('Bad Request', AlreadyFrozen, 'account already frozen'),
    403: errorResponse(
      'Forbidden',
      NoPermission,
      'You can not do this action.',
    ),
    404: errorResponse('Not Found', AccountNotFound, 'account not found'),
    500: internalErrorResponse(accountInternalErrorSchema),
  },
});

export const UnFreezeAccountRoute = createRoute({
  method: 'delete',
  tags: ['accounts'],
  path: '/v0/accounts/:name/freeze',
  security: bearerAuth(),
  request: {
    params: accountNameParams(),
  },
  responses: {
    204: noContentResponse('No Content'),
    403: errorResponse(
      'Forbidden',
      NoPermission,
      'You can not do this action.',
    ),
    404: errorResponse('Not Found', AccountNotFound, 'account not found'),
    500: internalErrorResponse(accountInternalErrorSchema),
  },
});

export const ResendVerificationEmailRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/v0/accounts/:name/resend_verify_email',
  request: {
    params: accountNameParams(),
    body: jsonBody(ResendVerificationEmailRequestSchema),
  },
  responses: {
    204: noContentResponse('No Content'),
    400: errorResponse(
      'Bad Request',
      AccountAlreadyVerified,
      'account email is already verified.',
    ),
    403: errorResponse(
      'Forbidden',
      NoPermission,
      'You can not do this action.',
    ),
    404: errorResponse('Not Found', AccountNotFound, 'account not found'),
    500: internalErrorResponse(accountInternalErrorSchema),
  },
});

export const VerifyEmailRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/v0/accounts/:name/verify_email',
  request: {
    params: accountNameParams(),
    body: jsonBody(VerifyEmailRequestSchema),
  },
  responses: {
    204: noContentResponse('No Content'),
    400: errorResponse(
      'Bad Request',
      InvalidEMailVerifyToken,
      'email address token is invalid',
    ),
    404: errorResponse('Not Found', AccountNotFound, 'account not found'),
    500: internalErrorResponse(accountInternalErrorSchema),
  },
});

export const LoginRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/v0/login',
  request: {
    body: jsonBody(LoginRequestSchema),
  },
  responses: {
    200: okResponse(LoginResponseSchema),
    400: errorResponse('Bad Request', FailedToLogin, 'failed to login.'),
    403: errorResponse('Forbidden', YouAreFrozen, 'You can not login.'),
    500: internalErrorResponse(accountInternalErrorSchema),
  },
});

export const RefreshRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/v0/refresh',
  request: {
    headers: z.object({
      Authorization: z.string().openapi({
        description: 'Bearer token',
      }),
    }),
  },
  responses: {
    200: okResponse(RefreshResponseSchema),
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: z.object({
            error: z.union([InvalidRefreshToken, ExpiredToken]).openapi({
              description: 'error codes',
              example: 'INVALID_TOKEN',
            }),
          }),
        },
      },
    },
    500: internalErrorResponse(accountInternalErrorSchema),
  },
});

export const GetAccountRoute = createRoute({
  method: 'get',
  tags: ['accounts'],
  path: '/v0/accounts/:identifier',
  request: {
    params: z.object({
      identifier: z
        .union([
          z.string().openapi({
            example: '@johndoe@example.com',
            description: 'account name',
          }),
          z.string().openapi({
            example: '31644833000002',
            description: 'account id',
          }),
        ])
        .openapi({
          example: '@johndoe@example.com',
          description: 'account name or id',
        }),
    }),
  },
  responses: {
    200: okResponse(GetAccountResponseSchema),
    404: errorResponse('Not Found', AccountNotFound, 'account not found'),
    500: internalErrorResponse(accountInternalErrorSchema),
  },
});

export const SilenceAccountRoute = createRoute({
  method: 'put',
  tags: ['accounts'],
  path: '/v0/accounts/:name/silence',
  security: bearerAuth(),
  request: {
    params: accountNameParams(),
    body: {
      content: {
        'application/json': {
          // empty body
          schema: {},
        },
      },
    },
  },
  responses: {
    204: noContentResponse('No Content'),
    403: errorResponse(
      'Forbidden',
      NoPermission,
      'You can not do this action.',
    ),
    404: errorResponse('Not Found', AccountNotFound, 'account not found'),
    500: internalErrorResponse(accountInternalErrorSchema),
  },
});

export const UnSilenceAccountRoute = createRoute({
  method: 'delete',
  tags: ['accounts'],
  path: '/v0/accounts/:name/silence',
  security: bearerAuth(),
  request: {
    params: accountNameParams(),
    body: {
      content: {
        'application/json': {
          // empty body
          schema: {},
        },
      },
    },
  },
  responses: {
    204: noContentResponse('No Content'),
    403: errorResponse(
      'Forbidden',
      NoPermission,
      'You can not do this action.',
    ),
    404: errorResponse('Not Found', AccountNotFound, 'account not found'),
    500: internalErrorResponse(accountInternalErrorSchema),
  },
});

export const FollowAccountRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/v0/accounts/:name/follow',
  security: bearerAuth(),
  request: {
    params: accountNameParams(),
    body: {
      content: {
        'application/json': {
          // empty body
          schema: {},
        },
      },
    },
  },
  responses: {
    204: noContentResponse('Accepted(No Content)'),
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: z
            .object({
              error: z.union([AlreadyFollowing, YouAreBlocked]),
            })
            .openapi({
              description: 'You can not do this action.',
            }),
        },
      },
    },
    404: errorResponse('Not Found', AccountNotFound, 'account not found'),
    500: internalErrorResponse(accountInternalErrorSchema),
  },
});

export const UnFollowAccountRoute = createRoute({
  method: 'delete',
  tags: ['accounts'],
  path: '/v0/accounts/:name/follow',
  security: bearerAuth(),
  request: {
    params: accountNameParams(),
    body: {
      content: {
        'application/json': {
          // empty body
          schema: {},
        },
      },
    },
  },
  responses: {
    204: noContentResponse('No Content'),
    400: errorResponse(
      'Bad request',
      YouAreNotFollowing,
      'You are not following specified account.',
    ),
    404: errorResponse('Not Found', AccountNotFound, 'account not found'),
    500: internalErrorResponse(accountInternalErrorSchema),
  },
});

export const GetAccountFollowingRoute = createRoute({
  method: 'get',
  tags: ['accounts'],
  path: '/v0/accounts/:id/following',
  request: {
    params: z.object({
      id: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-.] The first and last characters must be [A-Za-z0-9-.]',
      }),
    }),
  },
  responses: {
    200: okResponse(GetAccountFollowingSchema),
    404: errorResponse('Not Found', AccountNotFound, 'account not found'),
    500: internalErrorResponse(accountInternalErrorSchema),
  },
});

export const GetAccountFollowerRoute = createRoute({
  method: 'get',
  tags: ['accounts'],
  path: '/v0/accounts/:id/follower',
  request: {
    params: z.object({
      id: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-.] The first and last characters must be [A-Za-z0-9-.]',
      }),
    }),
  },
  responses: {
    200: okResponse(GetAccountFollowingSchema),
    404: errorResponse('Not Found', AccountNotFound, 'account not found'),
    500: internalErrorResponse(accountInternalErrorSchema),
  },
});

export const SetAccountAvatarRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/v0/accounts/:name/avatar',
  security: bearerAuth(),
  request: {
    params: accountNameParams(),
    body: jsonBody(SetAccountAvatarRequestSchema),
  },
  responses: {
    204: noContentResponse('No Content'),
    403: errorResponse(
      'Forbidden',
      NoPermission,
      'You can not do this action.',
    ),
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z
            .object({
              error: z.union([AccountNotFound, FileNotFound]),
            })
            .openapi({
              description: 'account not found',
            }),
        },
      },
    },
    500: internalErrorResponse(accountInternalErrorSchema),
  },
});

export const UnsetAccountAvatarRoute = createRoute({
  method: 'delete',
  tags: ['accounts'],
  path: '/v0/accounts/:name/avatar',
  security: bearerAuth(),
  request: {
    params: accountNameParams(),
  },
  responses: {
    204: noContentResponse('No Content'),
    403: errorResponse(
      'Forbidden',
      NoPermission,
      'You can not do this action.',
    ),
    404: errorResponse('Not Found', AccountNotFound, 'account not found'),
    500: internalErrorResponse(accountInternalErrorSchema),
  },
});

export const SetAccountHeaderRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/v0/accounts/:name/header',
  security: bearerAuth(),
  request: {
    params: accountNameParams(),
    body: jsonBody(SetAccountAvatarRequestSchema),
  },
  responses: {
    204: noContentResponse('No Content'),
    403: errorResponse(
      'Forbidden',
      NoPermission,
      'You can not do this action.',
    ),
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z
            .object({
              error: z.union([AccountNotFound, FileNotFound]),
            })
            .openapi({
              description: 'account not found',
            }),
        },
      },
    },
    500: internalErrorResponse(accountInternalErrorSchema),
  },
});

export const UnsetAccountHeaderRoute = createRoute({
  method: 'delete',
  tags: ['accounts'],
  path: '/v0/accounts/:name/header',
  security: bearerAuth(),
  request: {
    params: accountNameParams(),
  },
  responses: {
    204: noContentResponse('No Content'),
    403: errorResponse(
      'Forbidden',
      NoPermission,
      'You can not do this action.',
    ),
    404: errorResponse('Not Found', AccountNotFound, 'account not found'),
    500: internalErrorResponse(accountInternalErrorSchema),
  },
});

export const GetAccountRelationshipsRoute = createRoute({
  method: 'get',
  tags: ['accounts'],
  path: '/v0/accounts/:id/relationships',
  security: bearerAuth(),
  request: {
    params: z.object({
      id: z.string().openapi({
        example: '31415926535',
        description: 'Account ID',
      }),
    }),
  },
  responses: {
    200: okResponse(GetAccountRelationshipsResponseSchema),
    404: errorResponse('Not Found', AccountNotFound, 'account not found'),
    500: internalErrorResponse(accountInternalErrorSchema),
  },
});
