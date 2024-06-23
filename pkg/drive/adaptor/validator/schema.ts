import { z } from '@hono/zod-openapi';

export const GetDriveMediaResponseSchema = z.array(
  z.object({
    id: z.string().openapi({
      description: 'medium ID',
      example: '38477395',
    }),
    author_id: z
      .string()
      .openapi({ description: 'account ID', example: '38477395' }),
    name: z.string().min(1).max(256).openapi({
      description: 'medium name',
      example: 'kyoto.jpg',
    }),
    hash: z.string().openapi({
      description: 'medium hash (blurhash)',
      example: 'LEHLk~WB2yk8pyo0adR*.7kCMdnj',
    }),
    mime: z.string().openapi({
      description: 'media mime type',
      example: 'image/jpeg',
    }),
    nsfw: z.boolean().pipe(z.coerce.boolean()).openapi({
      description: 'nsfw flag',
      example: false,
    }),
    url: z.string().url().openapi({
      description: 'media URL',
      example: 'https://example.com/38477395.jpg',
    }),
    thumbnail: z.string().url().openapi({
      description: 'thumbnail URL',
      example: 'https://example.com/38477395_thumb.jpg',
    }),
  }),
);
