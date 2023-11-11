import { Hono } from 'hono';
import { accounts } from './pkg/accounts/mod.ts';

const app = new Hono();

app.route('/accounts', accounts);

Deno.serve({ port: 3000 }, app.fetch);
