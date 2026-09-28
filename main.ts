import { serve } from '@hono/node-server';
import { Result } from '@mikuroxina/mini-fn';
import { Scalar } from '@scalar/hono-api-reference';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { accounts } from './pkg/accounts/mod.ts';
import { drive } from './pkg/drive/mod.ts';
import { noteHandlers } from './pkg/notes/mod.ts';
import { timeline } from './pkg/timeline/mod.ts';
import { Logger } from 'tslog';
import { closeNatsClient, connectNats, ensureStream, natsStreamName } from './pkg/adaptors/nats.ts';
import { isProduction } from './pkg/adaptors/env.ts';
import { prismaClient } from './pkg/adaptors/prisma.ts';
import { closeValkeyClients } from './pkg/adaptors/valkey.ts';
import { notification } from './pkg/notification/mod.ts';
import { eventSubscriber } from './pkg/internal/event/mod.ts';
import { NatsEventSubscriber } from './pkg/internal/event/adaptor/nats/subscriber.ts';
import type { EventSubscriber } from './pkg/internal/event/mod.ts';
import { startTimelineEventSubscriptions } from './pkg/timeline/subscription.ts';

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

async function setUpNatsSubscriber(): Promise<EventSubscriber> {
  const clientRes = await connectNats();
  if (Result.isErr(clientRes)) {
    coreLogger.error('Failed to connect to NATS', Result.unwrapErr(clientRes));
    process.exit(1);
  }
  const client = Result.unwrap(clientRes);

  const streamRes = await ensureStream(client);
  if (Result.isErr(streamRes)) {
    coreLogger.error(
      'Failed to ensure the NATS event stream',
      Result.unwrapErr(streamRes),
    );
    process.exit(1);
  }

  return new NatsEventSubscriber(client, natsStreamName);
}

async function main() {
  const subscriber: EventSubscriber = isProduction
    ? await setUpNatsSubscriber()
    : eventSubscriber;

  const subscriptionRes = await startTimelineEventSubscriptions(subscriber);
  if (Result.isErr(subscriptionRes)) {
    coreLogger.error(
      'Failed to start timeline event subscriptions',
      Result.unwrapErr(subscriptionRes),
    );
    process.exit(1);
  }
  const subscription = Result.unwrap(subscriptionRes);

  const server = serve({ fetch: app.fetch, port: 3000 }, (addr) => {
    coreLogger.info("Pulsate v0.1");
    if (isProduction) {
      coreLogger.info("Production mode");
    } else {
      coreLogger.info("Development mode");
    }

    coreLogger.info(`Server started at ${addr.address}:${addr.port} ${addr.family}`);
  });

  const shutdown = () => {
    coreLogger.info('Shutting down gracefully...');
    server.close(async () => {
      await subscription.stop();
      await Promise.all([
        prismaClient.$disconnect(),
        closeValkeyClients(),
        closeNatsClient(),
      ]);
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

await main();
