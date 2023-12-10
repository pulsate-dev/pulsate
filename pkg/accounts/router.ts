import { createRoute, z } from 'hono/zod-openapi';
import {
  CommonErrorResponseSchema,
  CreateAccountRequestSchema,
  CreateAccountResponseSchema,
  FollowAccountResponseSchema,
  GetAccountResponseSchema,
  LoginRequestSchema,
  RefreshRequestSchema,
  ResendVerificationEmailRequestSchema,
  UpdateAccountRequestSchema,
  UpdateAccountResponseSchema,
  VerifyEmailRequestSchema,
} from './adaptor/validator/schema.ts';

export const CreateAccountRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/accounts',
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
          schema: CommonErrorResponseSchema,
        },
      },
    },
    409: {
      description: 'Conflict',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
  },
});

export const UpdateAccountRoute = createRoute({
  method: 'patch',
  tags: ['accounts'],
  path: '/accounts/:name',
  request: {
    // ToDo: define ETag in header
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-\.] The first and last characters must be [A-Za-z0-9-\.]',
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
          schema: CommonErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
    412: {
      description: 'Precondition Failed',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
  },
});

export const FreezeAccountRoute = createRoute({
  method: 'put',
  tags: ['accounts'],
  path: '/accounts/:name/freeze',
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-\.] The first and last characters must be [A-Za-z0-9-\.]',
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
          schema: CommonErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
  },
});

export const UnFreezeAccountRoute = createRoute({
  method: 'delete',
  tags: ['accounts'],
  path: '/accounts/:name/freeze',
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-\.] The first and last characters must be [A-Za-z0-9-\.]',
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
          schema: CommonErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
  },
});

export const ResendVerificationEmailRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/accounts/:name/resend_verify_email',
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-\.] The first and last characters must be [A-Za-z0-9-\.]',
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
          schema: CommonErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
  },
});

export const VerifyEmailRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/accounts/:name/verify_email',
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-\.] The first and last characters must be [A-Za-z0-9-\.]',
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
          schema: CommonErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
  },
});

export const LoginRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/login',
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
          schema: UpdateAccountResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
  },
});

export const RefreshRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/refresh',
  request: {
    body: {
      content: {
        'application/json': {
          schema: RefreshRequestSchema,
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
    400: {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
  },
});

export const GetAccountRoute = createRoute({
  method: 'get',
  tags: ['accounts'],
  path: '/accounts/:name',
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-\.] The first and last characters must be [A-Za-z0-9-\.]',
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
  },
});

export const SilenceAccountRoute = createRoute({
  method: 'put',
  tags: ['accounts'],
  path: '/accounts/:name/silence',
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-\.] The first and last characters must be [A-Za-z0-9-\.]',
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
          schema: CommonErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
  },
});

export const UnSilenceAccountRoute = createRoute({
  method: 'delete',
  tags: ['accounts'],
  path: '/accounts/:name/silence',
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-\.] The first and last characters must be [A-Za-z0-9-\.]',
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
          schema: CommonErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
  },
});

export const FollowAccountRoute = createRoute({
  method: 'post',
  tags: ['accounts'],
  path: '/accounts/:name/follow',
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-\.] The first and last characters must be [A-Za-z0-9-\.]',
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
    201: {
      description: 'Accepted',
      content: {
        'application/json': {
          schema: FollowAccountResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
  },
});

export const UnFollowAccountRoute = createRoute({
  method: 'delete',
  tags: ['accounts'],
  path: '/accounts/:name/follow',
  request: {
    params: z.object({
      name: z.string().min(3).max(64).openapi({
        example: 'example_man',
        description:
          'Characters must be [A-Za-z0-9-\.] The first and last characters must be [A-Za-z0-9-\.]',
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
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: CommonErrorResponseSchema,
        },
      },
    },
  },
});
