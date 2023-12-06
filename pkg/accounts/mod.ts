import { OpenAPIHono } from 'hono/zod-openapi';
import { CreateAccountRoute } from './router.ts';

export const accounts = new OpenAPIHono();

accounts.openapi(CreateAccountRoute, (c) => {
  const {name, email} = c.req.valid("json");

  return c.json({
    id: "103848392",
    name: name,
    email: email,
  })
})

