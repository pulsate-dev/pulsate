import { Hono } from 'https://deno.land/x/hono@v3.8.2/mod.ts';

export const accounts = new Hono();

accounts.get('/', (c) => {
  return c.text('Hello, World!');
});
