import { serve } from '@hono/node-server';
import { Result } from '@mikuroxina/mini-fn';
import { Scalar } from '@scalar/hono-api-reference';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Logger } from 'tslog';

import { accounts } from './pkg/accounts/mod.ts';
import {
  closeNatsClient,
  connectNats,
  ensureNatsStream,
  natsStreamName,
} from './pkg/adaptors/nats.ts';
import { isProduction } from './pkg/adaptors/env.ts';
import { prismaClient } from './pkg/adaptors/prisma.ts';
import { closeValkeyClients } from './pkg/adaptors/valkey.ts';
import { drive } from './pkg/drive/mod.ts';
import { configureEventPublisher, eventSubscriber } from './pkg/internal/event/mod.ts';
import { NatsEventPublisher } from './pkg/internal/event/adaptor/nats/publisher.ts';
import { NatsEventSubscriber } from './pkg/internal/event/adaptor/nats/subscriber.ts';
import type { EventSubscriber, EventSubscription } from './pkg/internal/event/mod.ts';
import { noteHandlers } from './pkg/notes/mod.ts';
import { notification } from './pkg/notification/mod.ts';
import { startTimelineEventSubscriptions, timeline } from './pkg/timeline/mod.ts';

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

async function connectProductionEventSubscriber(): Promise<EventSubscriber> {
  const clientResult = await connectNats();
  if (Result.isErr(clientResult)) {
    coreLogger.error('Failed to connect to NATS', Result.unwrapErr(clientResult));
    process.exit(1);
  }
  const client = Result.unwrap(clientResult);

  const streamResult = await ensureNatsStream(client);
  if (Result.isErr(streamResult)) {
    coreLogger.error(
      'Failed to ensure the NATS event stream',
      Result.unwrapErr(streamResult),
    );
    await closeNatsClient();
    process.exit(1);
  }

  configureEventPublisher(new NatsEventPublisher(client));
  return new NatsEventSubscriber(client, natsStreamName);
}

async function startEventSubscriptions(): Promise<EventSubscription> {
  const subscriber = isProduction
    ? await connectProductionEventSubscriber()
    : eventSubscriber;

  const subscriptionResult = await startTimelineEventSubscriptions(subscriber);
  if (Result.isErr(subscriptionResult)) {
    coreLogger.error(
      'Failed to start timeline event subscriptions',
      Result.unwrapErr(subscriptionResult),
    );
    await closeNatsClient();
    process.exit(1);
  }
  return Result.unwrap(subscriptionResult);
}

async function main() {
  const subscription = await startEventSubscriptions();
  const server = serve({ fetch: app.fetch, port: 3000 }, (addr) => {
    coreLogger.info('Pulsate v0.1');
    coreLogger.info(isProduction ? 'Production mode' : 'Development mode');
    coreLogger.info(
      `Server started at ${addr.address}:${addr.port} ${addr.family}`,
    );
  });

  const shutdown = () => {
    coreLogger.info('Shutting down gracefully...');
    server.close(async () => {
      const subscriptionResult = await subscription.stop();
      if (Result.isErr(subscriptionResult)) {
        coreLogger.error(
          'Failed to stop timeline event subscriptions',
          Result.unwrapErr(subscriptionResult),
        );
      }
      const [, , natsResult] = await Promise.all([
        prismaClient.$disconnect(),
        closeValkeyClients(),
        closeNatsClient(),
      ]);
      if (Result.isErr(natsResult)) {
        coreLogger.error('Failed to close NATS connection', Result.unwrapErr(natsResult));
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

await main();
