import type { AccountID } from '../../accounts/model/account.js';
import { Medium, type MediumID } from '../model/medium.js';

export const testMedium = Medium.new({
  id: '300' as MediumID,
  name: 'test.jpg',
  mime: 'image/jpeg',
  authorId: '101' as AccountID,
  nsfw: false,
  url: 'https://example.com/test.jpg',
  thumbnailUrl: 'https://example.com/test_thumbnail.jpg',
  hash: '40kdflnrh',
});

export const testNSFWMedium = Medium.new({
  id: '301' as MediumID,
  name: 'test.jpg',
  mime: 'image/jpeg',
  authorId: '101' as AccountID,
  nsfw: true,
  url: 'https://example.com/test.jpg',
  thumbnailUrl: 'https://example.com/test_thumbnail.jpg',
  hash: '40kdflnrh',
});
