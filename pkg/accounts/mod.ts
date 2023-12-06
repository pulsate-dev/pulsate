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

accounts.doc("/accounts/doc.json", {
  openapi: "3.0.0",
  info: {
    title: "Accounts API",
    version: "0.1.0",
  },
})

