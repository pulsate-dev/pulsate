import { createRoute, z } from '@hono/zod-openapi';

import { FileNotFound } from '../drive/adaptor/presenter/errors.js';
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
} from './adaptor/presenter/errors.js';
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
} from './adaptor/validator/schema.js';

const InternalErrorResponseSchema = z
  .object({
    error: InternalError,
  })
  .openapi('InternalErrorResponse');

export const CreateAccountRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/v0/accounts',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateAccountRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: CreateAccountResponseSchema,
        },
      },
    },
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
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: InternalErrorResponseSchema,
        },
      },
    },
  },
});

export const UpdateAccountRoute = createRoute({
  method: 'patch',
  tags: ['accounts'],
  path: '/v0/accounts/:name',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-.] The first and last characters must be [A-Za-z0-9-.]',
      }),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateAccountRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: UpdateAccountResponseSchema,
        },
      },
    },
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
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z
            .object({
              error: AccountNotFound,
            })
            .openapi({
              description: 'account not found',
            }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: InternalErrorResponseSchema,
        },
      },
    },
  },
});

export const FreezeAccountRoute = createRoute({
  method: 'put',
  tags: ['accounts'],
  path: '/v0/accounts/:name/freeze',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-.] The first and last characters must be [A-Za-z0-9-.]',
      }),
    }),
  },
  responses: {
    204: {
      description: 'No Content',
    },
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: z
            .object({
              error: AlreadyFrozen,
            })
            .openapi({
              description: 'account already frozen',
            }),
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: z
            .object({
              error: NoPermission,
            })
            .openapi({
              description: 'You can not do this action.',
            }),
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z
            .object({
              error: AccountNotFound,
            })
            .openapi({
              description: 'account not found',
            }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: InternalErrorResponseSchema,
        },
      },
    },
  },
});

export const UnFreezeAccountRoute = createRoute({
  method: 'delete',
  tags: ['accounts'],
  path: '/v0/accounts/:name/freeze',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-.] The first and last characters must be [A-Za-z0-9-.]',
      }),
    }),
  },
  responses: {
    204: {
      description: 'No Content',
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: z
            .object({
              error: NoPermission,
            })
            .openapi({
              description: 'You can not do this action.',
            }),
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z
            .object({
              error: AccountNotFound,
            })
            .openapi({
              description: 'account not found',
            }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: InternalErrorResponseSchema,
        },
      },
    },
  },
});

export const ResendVerificationEmailRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/v0/accounts/:name/resend_verify_email',
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-.] The first and last characters must be [A-Za-z0-9-.]',
      }),
    }),
    body: {
      content: {
        'application/json': {
          schema: ResendVerificationEmailRequestSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: 'No Content',
    },
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: z
            .object({ error: AccountAlreadyVerified })
            .openapi({ description: 'account email is already verified.' }),
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: z
            .object({
              error: NoPermission,
            })
            .openapi({
              description: 'You can not do this action.',
            }),
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z
            .object({
              error: AccountNotFound,
            })
            .openapi({
              description: 'account not found',
            }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: InternalErrorResponseSchema,
        },
      },
    },
  },
});

export const VerifyEmailRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/v0/accounts/:name/verify_email',
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-.] The first and last characters must be [A-Za-z0-9-.]',
      }),
    }),
    body: {
      content: {
        'application/json': {
          schema: VerifyEmailRequestSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: 'No Content',
    },
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: z
            .object({
              error: InvalidEMailVerifyToken,
            })
            .openapi({ description: 'email address token is invalid' }),
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z
            .object({
              error: AccountNotFound,
            })
            .openapi({
              description: 'account not found',
            }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: InternalErrorResponseSchema,
        },
      },
    },
  },
});

export const LoginRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/v0/login',
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: LoginResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: z
            .object({
              error: FailedToLogin,
            })
            .openapi({
              description: 'failed to login.',
            }),
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: z
            .object({
              error: YouAreFrozen,
            })
            .openapi({
              description: 'You can not login.',
            }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: InternalErrorResponseSchema,
        },
      },
    },
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
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: RefreshResponseSchema,
        },
      },
    },
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
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: InternalErrorResponseSchema,
        },
      },
    },
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
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: GetAccountResponseSchema,
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z
            .object({
              error: AccountNotFound,
            })
            .openapi({
              description: 'account not found',
            }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: InternalErrorResponseSchema,
        },
      },
    },
  },
});

export const SilenceAccountRoute = createRoute({
  method: 'put',
  tags: ['accounts'],
  path: '/v0/accounts/:name/silence',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-.] The first and last characters must be [A-Za-z0-9-.]',
      }),
    }),
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
    204: {
      description: 'No Content',
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: z
            .object({
              error: NoPermission,
            })
            .openapi({
              description: 'You can not do this action.',
            }),
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z
            .object({
              error: AccountNotFound,
            })
            .openapi({
              description: 'account not found',
            }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: InternalErrorResponseSchema,
        },
      },
    },
  },
});

export const UnSilenceAccountRoute = createRoute({
  method: 'delete',
  tags: ['accounts'],
  path: '/v0/accounts/:name/silence',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-.] The first and last characters must be [A-Za-z0-9-.]',
      }),
    }),
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
    204: {
      description: 'No Content',
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: z
            .object({
              error: NoPermission,
            })
            .openapi({
              description: 'You can not do this action.',
            }),
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z
            .object({
              error: AccountNotFound,
            })
            .openapi({
              description: 'account not found',
            }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: InternalErrorResponseSchema,
        },
      },
    },
  },
});

export const FollowAccountRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/v0/accounts/:name/follow',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-.] The first and last characters must be [A-Za-z0-9-.]',
      }),
    }),
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
    204: {
      description: 'Accepted(No Content)',
    },
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
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z
            .object({
              error: AccountNotFound,
            })
            .openapi({
              description: 'account not found',
            }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: InternalErrorResponseSchema,
        },
      },
    },
  },
});

export const UnFollowAccountRoute = createRoute({
  method: 'delete',
  tags: ['accounts'],
  path: '/v0/accounts/:name/follow',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-.] The first and last characters must be [A-Za-z0-9-.]',
      }),
    }),
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
    204: {
      description: 'No Content',
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: z
            .object({
              error: YouAreNotFollowing,
            })
            .openapi({
              description: 'You are not following specified account.',
            }),
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z
            .object({
              error: AccountNotFound,
            })
            .openapi({
              description: 'account not found',
            }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: InternalErrorResponseSchema,
        },
      },
    },
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
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: GetAccountFollowingSchema,
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z
            .object({
              error: AccountNotFound,
            })
            .openapi({
              description: 'account not found',
            }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: InternalErrorResponseSchema,
        },
      },
    },
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
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: GetAccountFollowingSchema,
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z
            .object({
              error: AccountNotFound,
            })
            .openapi({
              description: 'account not found',
            }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: InternalErrorResponseSchema,
        },
      },
    },
  },
});

export const SetAccountAvatarRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/v0/accounts/:name/avatar',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-.] The first and last characters must be [A-Za-z0-9-.]',
      }),
    }),
    body: {
      content: {
        'application/json': {
          schema: SetAccountAvatarRequestSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: 'No Content',
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: z
            .object({
              error: NoPermission,
            })
            .openapi({
              description: 'You can not do this action.',
            }),
        },
      },
    },
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
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: InternalErrorResponseSchema,
        },
      },
    },
  },
});

export const UnsetAccountAvatarRoute = createRoute({
  method: 'delete',
  tags: ['accounts'],
  path: '/v0/accounts/:name/avatar',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-.] The first and last characters must be [A-Za-z0-9-.]',
      }),
    }),
  },
  responses: {
    204: {
      description: 'No Content',
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: z
            .object({
              error: NoPermission,
            })
            .openapi({
              description: 'You can not do this action.',
            }),
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z
            .object({
              error: AccountNotFound,
            })
            .openapi({
              description: 'account not found',
            }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: InternalErrorResponseSchema,
        },
      },
    },
  },
});

export const SetAccountHeaderRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/v0/accounts/:name/header',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-.] The first and last characters must be [A-Za-z0-9-.]',
      }),
    }),
    body: {
      content: {
        'application/json': {
          schema: SetAccountAvatarRequestSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: 'No Content',
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: z
            .object({
              error: NoPermission,
            })
            .openapi({
              description: 'You can not do this action.',
            }),
        },
      },
    },
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
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: InternalErrorResponseSchema,
        },
      },
    },
  },
});

export const UnsetAccountHeaderRoute = createRoute({
  method: 'delete',
  tags: ['accounts'],
  path: '/v0/accounts/:name/header',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-.] The first and last characters must be [A-Za-z0-9-.]',
      }),
    }),
  },
  responses: {
    204: {
      description: 'No Content',
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: z
            .object({
              error: NoPermission,
            })
            .openapi({
              description: 'You can not do this action.',
            }),
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z
            .object({
              error: AccountNotFound,
            })
            .openapi({
              description: 'account not found',
            }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: InternalErrorResponseSchema,
        },
      },
    },
  },
});

export const GetAccountRelationshipsRoute = createRoute({
  method: 'get',
  tags: ['accounts'],
  path: '/v0/accounts/:id/relationships',
  security: [
    {
      bearer: [],
    },
  ],
  request: {
    params: z.object({
      id: z.string().openapi({
        example: '31415926535',
        description: 'Account ID',
      }),
    }),
  },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: GetAccountRelationshipsResponseSchema,
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: z
            .object({
              error: AccountNotFound,
            })
            .openapi({
              description: 'account not found',
            }),
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: InternalErrorResponseSchema,
        },
      },
    },
  },
});
