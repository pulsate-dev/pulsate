import { Redis } from 'ioredis';

export const valkeyClient = (): Redis => {
  const redisHost = process.env.VALKEY_REDIS_HOST || 'localhost';
  return new Redis(`${redisHost}:6379`);
};
