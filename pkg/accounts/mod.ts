import { OpenAPIHono } from 'hono/zod-openapi';
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
  VerifyEmailRoute,
} from './router.ts';

export const accounts = new OpenAPIHono();

accounts.doc('/accounts/doc.json', {
  openapi: '3.0.0',
  info: {
    title: 'Accounts API',
    version: '0.1.0',
  },
});

accounts.openapi(CreateAccountRoute, (c) => {
  const { name, email } = c.req.valid('json');

  return c.json({
    id: '103848392',
    name: name,
    email: email,
  });
});

accounts.openapi(UpdateAccountRoute, (c) => {
  const { bio, email, nickname } = c.req.valid('json');

  return c.json({
    id: '103848392',
    name: name,
    nickname: nickname,
    email: email,
    bio: bio,
  });
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
    note_count: 20000,
  });
});

accounts.openapi(LoginRoute, (c) => {
  return c.json({
    authorization_token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZTE2NDQ4MzMwMDAwMDIiLCJpYXQiOjE2NDA5OTUyMDEsInJlZnJlc2hfdG9rZW4iOiJleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKemRXSWlPaUl6WlRFMk5EUTRNek13TURBd01ESWlMQ0pwWVhRaU9qRTJOREE1T1RVeU1ERjkud2Q4cWJVcWowWGtCU1hud0FxM0lRYU1nQS1RTFd2MHVKU1NLX3BIVTZCYyJ9.mRUfLIYOGlLuC9D72zBriVvrHYrQgVHW7ntQ-bp5SHs',
    refresh_token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZTE2NDQ4MzMwMDAwMDIiLCJpYXQiOjE2NDA5OTUyMDEsInJlZnJlc2hfdG9rZW4iOiJleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKemRXSWlPaUl6WlRFMk5EUTRNek13TURBd01ESWlMQ0pwWVhRaU9qRTJOREE1T1RVeU1ERjkud2Q4cWJVcWowWGtCU1hud0FxM0lRYU1nQS1RTFd2MHVKU1NLX3BIVTZCYyJ9.mRUfLIYOGlLuC9D72zBriVvrHYrQgVHW7ntQ-bp5SHs',
    expires_in: 10000000000,
  });
});

accounts.openapi(RefreshRoute, (c) => {
  return c.json({
    authorization_token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZTE2NDQ4MzMwMDAwMDIiLCJpYXQiOjE2NDA5OTUyMDEsInJlZnJlc2hfdG9rZW4iOiJleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKemRXSWlPaUl6WlRFMk5EUTRNek13TURBd01ESWlMQ0pwWVhRaU9qRTJOREE1T1RVeU1ERjkud2Q4cWJVcWowWGtCU1hud0FxM0lRYU1nQS1RTFd2MHVKU1NLX3BIVTZCYyJ9.mRUfLIYOGlLuC9D72zBriVvrHYrQgVHW7ntQ-bp5SHs',
  });
});

accounts.openapi(SilenceAccountRoute, () => {
  return new Response(null, { status: 204 });
});

accounts.openapi(UnSilenceAccountRoute, () => {
  return new Response(null, { status: 204 });
});

accounts.openapi(FollowAccountRoute, () => {
  return new Response(null, { status: 204 });
});

accounts.openapi(ResendVerificationEmailRoute, () => {
  return new Response(null, { status: 204 });
});

accounts.openapi(UnFollowAccountRoute, () => {
  return new Response(null, { status: 204 });
});
