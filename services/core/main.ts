import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.text('Hello World\nPulsate v0.1'));

Deno.serve({ port: 3000 }, app.fetch);
