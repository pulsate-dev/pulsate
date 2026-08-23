import { Redis } from 'ioredis';

const clients: Redis[] = [];

export const valkeyClient = (): Redis => {
  const redisHost = process.env.VALKEY_REDIS_HOST || 'localhost';
  const client = new Redis(`${redisHost}:6379`);
  clients.push(client);
  return client;
};

export const closeValkeyClients = () =>
  Promise.all(clients.map((client) => client.quit()));
