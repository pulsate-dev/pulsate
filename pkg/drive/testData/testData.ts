import { Option } from '@mikuroxina/mini-fn';
import type { Account } from '../../accounts/model/account.ts';
import {
  dummyNormalAccount1,
  dummyNormalAccount2,
} from '../../accounts/testData/testData.ts';
import { DUMMY_BASE_DATE, generateDummyID } from '../../internal/id/dummy.ts';
import { type CreateMediumArgs, Medium } from '../model/medium.ts';

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

export const dummyMedium = generateDummyMedium({
  authorId: dummyNormalAccount1.getID(),
});

export const dummyNSFWMedium = generateDummyMedium({
  authorId: dummyNormalAccount1.getID(),
  nsfw: true,
});

export const dummyOtherMedium = generateDummyMedium({
  authorId: dummyNormalAccount2.getID(),
});
