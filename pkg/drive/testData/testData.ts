import { Option } from '@mikuroxina/mini-fn';

import type { Account, AccountID } from '../../accounts/model/account.ts';
import { DUMMY_BASE_DATE, generateDummyID } from '../../internal/id/dummy.ts';
import {
  type CreateMediumArgs,
  Medium,
  type MediumID,
} from '../model/medium.ts';

/**
 * @description generate dummy medium (factory function)
 * @param overrides fields to override the default dummy values
 * @returns {@link Medium}
 */
export const generateDummyMedium = (
  overrides: Partial<CreateMediumArgs> = {},
): Medium =>
  Medium.reconstruct({
    id: generateDummyID<Medium>(DUMMY_BASE_DATE),
    name: 'test.jpg',
    mime: 'image/jpeg',
    authorId: generateDummyID<Account>(DUMMY_BASE_DATE),
    nsfw: false,
    url: Option.some('https://example.com/test.jpg'),
    thumbnailUrl: Option.some('https://example.com/test_thumbnail.jpg'),
    hash: '40kdflnrh',
    ...overrides,
  });

export const testMedium = generateDummyMedium({
  id: '300' as MediumID,
  authorId: '101' as AccountID,
});

export const testNSFWMedium = generateDummyMedium({
  id: '301' as MediumID,
  authorId: '101' as AccountID,
  nsfw: true,
});

export const testOtherMedium = generateDummyMedium({
  id: '303' as MediumID,
  authorId: '102' as AccountID,
});
