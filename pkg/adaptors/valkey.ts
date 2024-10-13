import { Redis } from 'ioredis';

export const valkeyClient = new Redis('localhost:6379');
