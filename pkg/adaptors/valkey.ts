import { Redis } from 'ioredis';

const redisHost = process.env.VALKEY_REDIS_HOST || 'localhost';

// NOTE: Single shared instance to avoid creating multiple valkey connections across modules
export const valkeyClient = new Redis(`${redisHost}:6379`);

export const closeValkeyClients = () => valkeyClient.quit();
