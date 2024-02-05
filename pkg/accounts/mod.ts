import { OpenAPIHono } from '@hono/zod-openapi';

import {
  CreateAccountRoute,
  FollowAccountRoute,
  FreezeAccountRoute,
  GetAccountRoute,
  LoginRoute,
  RefreshRoute,
  ResendVerificationEmailRoute,
  SilenceAccountRoute,
  UnFollowAccountRoute,
  UnFreezeAccountRoute,
  UnSilenceAccountRoute,
  UpdateAccountRoute,
  VerifyEmailRoute
} from './router.js';

export const accounts = new OpenAPIHono();

accounts.doc('/accounts/doc.json', {
  openapi: '3.0.0',
  info: {
    title: 'Accounts API',
    version: '0.1.0'
  }
});

accounts.openapi(CreateAccountRoute, (c) => {
  const { name, email } = c.req.valid('json');

  return c.json({
    id: '103848392',
    name: name,
    email: email
  });
});

accounts.openapi(UpdateAccountRoute, () => {
  throw new Error('Not implemented');
});

accounts.openapi(FreezeAccountRoute, () => {
  return new Response(null, { status: 204 });
});

accounts.openapi(UnFreezeAccountRoute, () => {
  return new Response(null, { status: 204 });
});

accounts.openapi(VerifyEmailRoute, () => {
  return new Response(null, { status: 204 });
});

accounts.openapi(GetAccountRoute, (c) => {
  return c.json({
    id: '2874987398',
    name: '@john@example.com',
    nickname: 'John Doe',
    bio: 'I am Test User.',
    avatar: 'https://example.com/images/avatar.png',
    header: 'https://example.com/images/header.png',
    followed_count: 200,
    following_count: 10,
    note_count: 20000
  });
});

accounts.openapi(LoginRoute, () => {
  throw new Error('Not implemented');
});

accounts.openapi(RefreshRoute, () => {
  throw new Error('Not implemented');
});

accounts.openapi(SilenceAccountRoute, () => {
  return new Response(null, { status: 204 });
});

accounts.openapi(UnSilenceAccountRoute, () => {
  return new Response(null, { status: 204 });
});

accounts.openapi(FollowAccountRoute, () => {
  throw new Error('Not implemented');
});

accounts.openapi(ResendVerificationEmailRoute, () => {
  return new Response(null, { status: 204 });
});

accounts.openapi(UnFollowAccountRoute, () => {
  return new Response(null, { status: 204 });
});
