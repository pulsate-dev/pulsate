import { Hono } from 'hono';
import { accounts } from './pkg/accounts/mod.ts';
import { apiReference } from 'scalar/hono-api-reference';

const app = new Hono();

app.route('/', accounts);
app.get('/notes', (c) => {
  return c.text('Hello, World!');
});

app.get('/doc.json', async (c) => {
  const modulePath: string[] = ['accounts'];
  const basePath = 'http://localhost:3000/';
  const openAPIBase = {
    'openapi': '3.0.0',
    'info': {
      'description': '',
      'title': 'Pulsate API Document',
      'version': '0.1.0',
    },
    'components': {
      'schemas': {},
      'parameters': {},
    },
    'paths': {},
  };

  const res = modulePath.map(async (path) => {
    return (await fetch(basePath + path + '/doc.json')).json();
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

app.get(
  '/reference',
  apiReference({
    pageTitle: 'Pulsate API',
    spec: {
      url: '/doc.json',
    },
  }),
);

Deno.serve({ port: 3000 }, app.fetch);
