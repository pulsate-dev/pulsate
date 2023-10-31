import { Hono } from 'https://deno.land/x/hono@v3.8.2/mod.ts';
import { accounts } from './pkg/accounts/mod.ts';

const app = new Hono();

app.route('/accounts', accounts);

Deno.serve({ port: 3000 }, app.fetch);
