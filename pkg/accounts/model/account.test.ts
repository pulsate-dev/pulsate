import { Result } from '@mikuroxina/mini-fn';
import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import {
  Account,
  type AccountID,
  AccountNameSchema,
  type CreateAccountArgs,
} from './account.js';

const exampleInput: CreateAccountArgs = {
  id: '1' as AccountID,
  bio: "this is john doe's account!",
  createdAt: new Date('2023-09-10T00:00:00.000Z'),
  mail: 'test@mail.example.com',
  nickname: 'John Doe',
  passphraseHash: 'leknflkwnrigohidvlk',
  role: 'admin',
  status: 'active',
  frozen: 'frozen',
  silenced: 'silenced',
  name: '@johndoe@social.example.com',
  updatedAt: new Date('2023-09-10T09:00:00.000Z'),
  deletedAt: new Date('2023-09-10T10:00:00.000Z'),
};

describe('Account', () => {
  const account = Account.new(exampleInput);

  it.each([
    ['id', account.getID(), exampleInput.id],
    ['name', account.getName(), exampleInput.name],
    ['mail', account.getMail(), exampleInput.mail],
    ['nickname', account.getNickname(), exampleInput.nickname],
    [
      'passphraseHash',
      account.getPassphraseHash(),
      exampleInput.passphraseHash,
    ],
    ['bio', account.getBio(), exampleInput.bio],
    ['role', account.getRole(), exampleInput.role],
    ['isActivated', account.isActivated(), false],
    ['createdAt', account.getCreatedAt(), exampleInput.createdAt],
    ['updatedAt', account.getUpdatedAt(), undefined],
    ['deletedAt', account.getDeletedAt(), undefined],
  ])('generates new instance: %s', (_, actual, expected) => {
    expect(actual).toBe(expected);
  });

  const validationCases: [
    string,
    (a: Account) => Result.Result<Error, void>,
  ][] = [
    ['nickname too long', (a) => a.setNickName('a'.repeat(257))],
    ['bio too long', (a) => a.setBio('a'.repeat(1025))],
  ];

  it.each(validationCases)('returns error when %s', (_, call) => {
    expect(Result.isErr(call(Account.new(exampleInput)))).toBe(true);
  });

  const mutationCalls: [string, (a: Account) => Result.Result<Error, void>][] =
    [
      ['setBio', (a) => a.setBio('test')],
      ['setNickName', (a) => a.setNickName('hello@example.com')],
      ['setPassphraseHash', (a) => a.setPassphraseHash('123')],
      ['setSilence', (a) => a.setSilence()],
      ['setMail', (a) => a.setMail('pulsate@example.com')],
    ];

  it.each(mutationCalls)('%s fails when account is frozen', (_, call) => {
    const frozen = Account.new(exampleInput);
    frozen.setFreeze();
    expect(Result.isErr(call(frozen))).toBe(true);
  });

  it.each(mutationCalls)('%s fails when account is deleted', (_, call) => {
    const deleted = Account.new(exampleInput);
    deleted.setDeletedAt(new Date());
    expect(Result.isErr(call(deleted))).toBe(true);
  });
});

describe('AccountNameSchema', () => {
  const check = (input: unknown) =>
    v.safeParse(AccountNameSchema, input).success;

  const account = Account.new(exampleInput);

  it.each([
    account.getName(),
    '@name@domain',
    '@name@example.com',
    '@name@xn--example-bs3o55gu19k.com',
  ])('valid account name: %s', (name) => {
    expect(check(name)).toBe(true);
  });

  it.each([
    '@@',
    '@_name_@example.com',
    '@name@domain@what',
    'what@name@domain',
    '@name@example.',
    '@name@.example.com',
    '@name@example-.com',
    '@name@example.com-',
    '@name@-example.com',
    '@name@example.-com',
    '@n_a_m_e_@sharp-#-sharp.com',
    '@query@?.com',
    '@name@日本語example.com',
  ])('invalid account name: %s', (name) => {
    expect(check(name)).toBe(false);
  });
});
