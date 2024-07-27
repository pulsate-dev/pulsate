import { serve } from '@hono/node-server';
import { apiReference } from '@scalar/hono-api-reference';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { accounts } from './pkg/accounts/mod.js';
import { drive } from './pkg/drive/mod.js';
import { noteHandlers } from './pkg/notes/mod.js';
import { timeline } from './pkg/timeline/mod.js';
import { swaggerUI } from '@hono/swagger-ui';

export const app = new Hono().get('/doc', async (c) => {
  // NOTE: If you create a new module, you must add module API doc base path here.
  const modulePath: string[] = ['accounts', 'notes', 'drive', 'timeline'];
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
        url: 'http://localhost:3000',
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

app.get(
  '/reference',
  apiReference({
    pageTitle: 'Pulsate API',
    spec: {
      url: '/doc',
    },
  }),
);

app.get("/ddoc", swaggerUI({ url: "/doc" }));

serve({ fetch: app.fetch, port: 3000 });
