import { serve } from '@hono/node-server';
import { Scalar } from '@scalar/hono-api-reference';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { accounts } from './pkg/accounts/mod.js';
import { drive } from './pkg/drive/mod.js';
import { noteHandlers } from './pkg/notes/mod.js';
import { timeline } from './pkg/timeline/mod.js';
import { Logger } from 'tslog';
import { isProduction } from './pkg/adaptors/env.js';
import { notification } from './pkg/notification/mod.js';

const coreLogger = new Logger({
  name: "Pulsate",
  type: "pretty",
})

export const app = new Hono().get('/doc', async (c) => {
  // NOTE: If you create a new module, you must add module API doc base path here.
  const modulePath: string[] = ['accounts', 'notes', 'drive', 'timeline', 'notification'];
  const basePath = 'http://localhost:3000/';
  const openAPIBase = {
    openapi: '3.1.0',
    info: {
      description: '',
      title: 'Pulsate API Document',
      version: '0.1.0',
    },
    servers: [
      {
        url: 'http://localhost:3000/',
        description: 'Local server',
      },
    ],
    components: {
      securitySchemes: {
        bearer: {
          type: 'http',
          scheme: 'bearer',
        },
      },
      schemas: {},
      parameters: {},
    },
    paths: {},
  };

  const res = modulePath.map(async (path) => {
    return (await fetch(`${basePath}${path}/doc.json`)).json();
  });

  for (const v in res) {
    const data = await res[v];
    openAPIBase.components.schemas = Object.assign(
      openAPIBase.components.schemas,
      data.components.schemas,
    );
    openAPIBase.components.parameters = Object.assign(
      openAPIBase.components.parameters,
      data.components.parameters,
    );
    openAPIBase.paths = Object.assign(openAPIBase.paths, data.paths);
  }

  return c.json(openAPIBase);
});

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'PATCH'],
  }),
);

/*
All routes must be "/"
(The "/" account cannot be written in the library specification.
*/
app.route('/', noteHandlers);
app.route('/', accounts);
app.route('/', drive);
app.route('/', timeline);
app.route('/', notification);

app.get(
  '/reference',
  Scalar({
    pageTitle: 'Pulsate API',
      url: '/doc',
  }),
);

serve({ fetch: app.fetch, port: 3000 }, (addr) => {
  coreLogger.info("Pulsate v0.1");
  if (isProduction) {
    coreLogger.info("Production mode");
  } else {
    coreLogger.info("Development mode");
  }

  coreLogger.info(`Server started at ${addr.address}:${addr.port} ${addr.family}`);
});
