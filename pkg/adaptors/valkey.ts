import { Redis } from 'ioredis';

export const valkeyClient = (): Redis => {
  return new Redis('localhost:6379');
};
