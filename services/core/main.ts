import { Hono } from 'https://deno.land/x/hono@v3.8.2/mod.ts';

const app = new Hono();

app.get('/', (c) => c.text('Hello World\nPulsate v0.1'));

Deno.serve({port: 3000},app.fetch);
