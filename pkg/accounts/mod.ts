import { Hono } from 'hono';

export const accounts = new Hono();

accounts.get('/', (c) => {
  return c.text('Hello, World!');
});
