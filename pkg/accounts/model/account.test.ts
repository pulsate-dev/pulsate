import { Option, Result } from '@mikuroxina/mini-fn';
import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import {
  Account,
  type AccountID,
  accountNameSchema,
  type CreateAccountArgs,
} from './account.ts';

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

const newAccount = () => Account.new(exampleInput, Option.none());

describe('Account', () => {
  const account = newAccount();

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
    ['nickname too long', (a) => a.setNickName('a'.repeat(257), a.getID())],
    ['bio too long', (a) => a.setBio('a'.repeat(1025), a.getID())],
    ['mail too short', (a) => a.setMail('a'.repeat(6), a.getID())],
    ['mail too long', (a) => a.setMail('a'.repeat(320), a.getID())],
  ];

  it('allows empty string as nickname (no nickname set)', () => {
    const account = newAccount();
    expect(Result.isOk(account.setNickName('', account.getID()))).toBe(true);
  });

  it.each(validationCases)('returns error when %s', (_, call) => {
    expect(Result.isErr(call(newAccount()))).toBe(true);
  });

  describe('validatePassphrase', () => {
    it.each([
      { title: 'length 8', passphrase: 'a'.repeat(8) },
      { title: 'length 512', passphrase: 'a'.repeat(512) },
    ])('succeeds when $title', ({ passphrase }) => {
      expect(Result.isOk(Account.validatePassphrase(passphrase))).toBe(true);
    });

    it.each([
      { title: 'too short', passphrase: 'a'.repeat(7) },
      { title: 'too long', passphrase: 'a'.repeat(513) },
    ])('fails when $title', ({ passphrase }) => {
      expect(Result.isErr(Account.validatePassphrase(passphrase))).toBe(true);
    });
  });

  const mutationCalls: [string, (a: Account) => Result.Result<Error, void>][] =
    [
      ['setBio', (a) => a.setBio('test', a.getID())],
      ['setNickName', (a) => a.setNickName('hello@example.com', a.getID())],
      ['setPassphraseHash', (a) => a.setPassphraseHash('123')],
      ['setSilence', (a) => a.setSilence(a.getID())],
      ['setMail', (a) => a.setMail('pulsate@example.com', a.getID())],
    ];

  it.each(mutationCalls)('%s fails when account is frozen', (_, call) => {
    const frozen = newAccount();
    frozen.setFreeze(frozen.getID());
    expect(Result.isErr(call(frozen))).toBe(true);
  });

  it.each(mutationCalls)('%s fails when account is deleted', (_, call) => {
    const deleted = newAccount();
    deleted.setDeletedAt(new Date());
    expect(Result.isErr(call(deleted))).toBe(true);
  });
});

describe('Account domain events', () => {
  it('new() generates an account.registered event', () => {
    const account = newAccount();
    const events = account.pullEvents();

    expect(events).toHaveLength(1);
    const [event] = events;
    expect(event?.eventName).toBe('account.registered');
    expect(event?.target).toBe(account.getID());
    expect(event?.actor).toStrictEqual(Option.none());
    expect(event?.payload).toStrictEqual({ mail: exampleInput.mail });
  });

  it('pullEvents() is destructive', () => {
    const account = newAccount();
    expect(account.pullEvents()).toHaveLength(1);
    expect(account.pullEvents()).toStrictEqual([]);
  });

  const mutationEventCases: [
    string,
    (a: Account) => Result.Result<Error, void>,
    string,
  ][] = [
    ['setBio', (a) => a.setBio('new bio', a.getID()), 'account.bio.updated'],
    [
      'setNickName',
      (a) => a.setNickName('new nickname', a.getID()),
      'account.nickname.updated',
    ],
    [
      'setMail',
      (a) => a.setMail('new@example.com', a.getID()),
      'account.email.updated',
    ],
    ['setFreeze', (a) => a.setFreeze(a.getID()), 'account.admin.frozen'],
    ['setUnfreeze', (a) => a.setUnfreeze(a.getID()), 'account.admin.unfrozen'],
    ['setSilence', (a) => a.setSilence(a.getID()), 'account.admin.silenced'],
    [
      'undoSilence',
      (a) => a.undoSilence(a.getID()),
      'account.admin.unsilenced',
    ],
    ['activate', (a) => a.activate(Option.none()), 'account.activated'],
  ];

  it.each(mutationEventCases)(
    '%s pushes a %s event on success',
    (_, call, eventName) => {
      const account = newAccount();
      account.pullEvents();

      const result = call(account);
      expect(Result.isOk(result)).toBe(true);

      const events = account.pullEvents();
      expect(events).toHaveLength(1);
      const [event] = events;
      expect(event?.eventName).toBe(eventName);
      expect(event?.target).toBe(account.getID());
    },
  );

  it.each(mutationEventCases)(
    '%s does not push an event when the account is already deleted',
    (_, call) => {
      const account = newAccount();
      account.pullEvents();
      account.setDeletedAt(new Date('2023-09-11T00:00:00.000Z'));

      const result = call(account);
      expect(Result.isErr(result)).toBe(true);
      expect(account.pullEvents()).toStrictEqual([]);
    },
  );
});

describe('AccountNameSchema', () => {
  const check = (input: unknown) =>
    v.safeParse(accountNameSchema, input).success;

  const account = newAccount();

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
