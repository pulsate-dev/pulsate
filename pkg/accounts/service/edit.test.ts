import { Option, Result } from '@mikuroxina/mini-fn';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Argon2idPasswordEncoder } from '../../password/mod.js';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.js';
import { Account, type AccountID } from '../model/account.js';
import { EditService } from './edit.js';
import { EtagService } from './etagService.js';

const passwordEncoder = new Argon2idPasswordEncoder();
const repository = new InMemoryAccountRepository();
const etagService = new EtagService();
const editService = new EditService(repository, etagService, passwordEncoder);

describe('EditService', () => {
  let account: Account;
  let etag: string;

  beforeEach(async () => {
    await repository.create(
      Account.reconstruct({
        id: '1' as AccountID,
        name: '@john@example.com',
        mail: 'johndoe@example.com',
        nickname: 'John Doe',
        passphraseHash: 'hash',
        bio: '',
        role: 'normal',
        frozen: 'normal',
        silenced: 'normal',
        status: 'active',
        createdAt: new Date(),
      }),
    );
    const res = await repository.findByName('@john@example.com');
    if (Option.isNone(res)) return;

    etag = await etagService.generate(res[1]);
    account = res[1];
  });
  afterEach(() => repository.reset());

  describe('nickname', () => {
    it.each([
      {
        title: 'nickname',
        nickname: 'new nickname',
      },
      {
        title: 'when nickname length 256',
        nickname: 'a'.repeat(256),
      },
      {
        title: 'when nickname length 1',
        nickname: 'a',
      },
    ])(
      'should be success to update $title', //
      async ({ nickname }) => {
        const updateRes = await editService.editNickname(
          etag,
          '@john@example.com',
          nickname,
          '@john@example.com',
        );
        expect(Result.isOk(updateRes)).toBe(true);

        expect(account.getNickname()).toBe(nickname);
        expect((await repository.findByName('@john@example.com'))[1]).toBe(
          account,
        );
      },
    );

    it.each([
      {
        title: 'nickname length shorter more than 1',
        nickname: '',
      },
      {
        title: 'nickname length more than 256',
        nickname: 'a'.repeat(257),
      },
      {
        title: 'etag not match',
        etag: 'invalid',
        nickname: 'new nickname',
      },
      {
        title: 'account not found',
        name: '@foo@example.com' as const,
        nickname: 'new nickname',
      },
    ])(
      'should be fail to update nickname when $title',
      async ({ etag: invalid, name, nickname }) => {
        const updateRes = await editService.editNickname(
          invalid ?? etag,
          name ?? '@john@example.com',
          nickname,
          name ?? '@john@example.com',
        );
        expect(Result.isErr(updateRes)).toBe(true);
      },
    );
  });

  describe('passphrase', () => {
    it.each([
      {
        title: 'passphrase',
        passphrase: 'new password',
      },
      {
        title: 'when passphrase length 8',
        passphrase: 'a'.repeat(8),
      },
      {
        title: 'when passphrase length 512',
        passphrase: 'a'.repeat(512),
      },
    ])(
      'should be success to update $title', //
      async ({ passphrase }) => {
        const updateRes = await editService.editPassphrase(
          etag,
          '@john@example.com',
          passphrase,
          '@john@example.com',
        );
        expect(Result.isOk(updateRes)).toBe(true);

        expect(
          await passwordEncoder.isMatchPassword(
            passphrase,
            account.getPassphraseHash() ?? '',
          ),
        ).toBe(true);
        expect((await repository.findByName('@john@example.com'))[1]).toBe(
          account,
        );
      },
    );

    it.each([
      {
        title: 'shorter more than 8',
        passphrase: 'a'.repeat(7),
      },
      {
        title: 'longer more than 512',
        passphrase: 'a'.repeat(513),
      },
      {
        title: 'etag not match',
        etag: 'invalid',
        passphrase: 'new password',
      },
      {
        title: 'account not found',
        name: '@foo@example.com' as const,
        passphrase: 'new password',
      },
    ])(
      'should be failed to update passphrase when $title',
      async ({ etag: invalid, name, passphrase }) => {
        const updateRes = await editService.editPassphrase(
          invalid ?? etag,
          name ?? '@john@example.com',
          passphrase,
          name ?? '@john@example.com',
        );

        expect(Result.isErr(updateRes)).toBe(true);
      },
    );
  });

  describe('email', () => {
    it.each([
      {
        title: 'email',
        email: 'pulsate@example.com',
      },
      {
        title: 'when shortest',
        email: 'a'.repeat(7),
      },
      {
        title: 'when email length 8',
        email: 'a'.repeat(8),
      },
      {
        title: 'when email length 319',
        email: 'a'.repeat(319),
      },
    ])(
      'should be success to update $title', //
      async ({ email }) => {
        const updateRes = await editService.editEmail(
          etag,
          '@john@example.com',
          email,
          '@john@example.com',
        );
        expect(Result.isOk(updateRes)).toBe(true);

        expect(account.getMail()).toBe(email);
        expect((await repository.findByName('@john@example.com'))[1]).toBe(
          account,
        );
      },
    );

    it.each([
      {
        title: 'etag not match',
        etag: 'invalid',
        email: 'pulsate@example.com',
      },
      {
        title: 'account not found',
        name: '@foo@example.com' as const,
        email: 'pulsate@example.com',
      },
      {
        title: 'too long',
        email: 'a'.repeat(320),
      },
    ])(
      'should be fail to update email when $title',
      async ({ etag: invalid, name, email }) => {
        const updateRes = await editService.editEmail(
          invalid ?? etag,
          name ?? '@john@example.com',
          email,
          name ?? '@john@example.com',
        );
        expect(Result.isErr(updateRes)).toBe(true);
      },
    );
  });

  describe('bio', () => {
    it.each([
      {
        bio: 'new bio',
      },
    ])(
      'should be success to update bio', //
      async ({ bio }) => {
        const updateRes = await editService.editBio(
          etag,
          '@john@example.com',
          bio,
          '@john@example.com',
        );

        expect(Result.isOk(updateRes)).toBe(true);

        expect(account.getBio()).toBe(bio);
        expect((await repository.findByName('@john@example.com'))[1]).toBe(
          account,
        );
      },
    );

    it.each([
      {
        title: 'etag not match',
        etag: 'invalid',
        bio: 'new bio',
      },
      {
        title: 'account not found',
        name: '@foo@example.com' as const,
        bio: 'new bio',
      },
    ])(
      'should be fail to update bio when $title',
      async ({ etag: invalid, name, bio }) => {
        const updateRes = await editService.editBio(
          invalid ?? etag,
          name ?? '@john@example.com',
          bio,
          name ?? '@john@example.com',
        );

        expect(Result.isErr(updateRes)).toBe(true);
      },
    );
  });

  describe('access controll', async () => {
    const testNormalAccount = Account.reconstruct({
      id: '2' as AccountID,
      name: '@alice@example.com',
      mail: 'alice@example.com',
      nickname: 'Alice',
      passphraseHash: 'hash',
      bio: '',
      role: 'normal',
      frozen: 'normal',
      silenced: 'normal',
      status: 'active',
      createdAt: new Date(),
    });
    const testFrozenAccount = Account.reconstruct({
      id: '3' as AccountID,
      name: '@bob@example.com',
      mail: 'bob@example.com',
      nickname: 'Bob',
      passphraseHash: 'hash',
      bio: '',
      role: 'normal',
      frozen: 'frozen',
      silenced: 'normal',
      status: 'active',
      createdAt: new Date(),
    });
    const testNotAcvivatedAccount = Account.reconstruct({
      id: '4' as AccountID,
      name: '@carol@example.com',
      mail: 'carol@example.com',
      nickname: 'Carol',
      passphraseHash: 'hash',
      bio: '',
      role: 'normal',
      frozen: 'normal',
      silenced: 'normal',
      status: 'notActivated',
      createdAt: new Date(),
    });
    beforeEach(async () => {
      repository.create(testNormalAccount);
      repository.create(testFrozenAccount);
      repository.create(testNotAcvivatedAccount);
    });

    it("can't edit other account data", async () => {
      const nickname = await editService.editNickname(
        etag,
        account.getName(),
        'new nickname',
        testNormalAccount.getName(),
      );
      const passphrase = await editService.editPassphrase(
        etag,
        account.getName(),
        'new password',
        testNormalAccount.getName(),
      );
      const email = await editService.editEmail(
        etag,
        account.getName(),
        'test@example.com',
        testNormalAccount.getName(),
      );
      const bio = await editService.editBio(
        etag,
        account.getName(),
        'new bio',
        testNormalAccount.getName(),
      );

      expect(Result.isOk(nickname)).toBe(false);
      expect(passphrase[1]).toStrictEqual(new Error('not allowed'));

      expect(Result.isOk(email)).toBe(false);
      expect(email[1]).toStrictEqual(new Error('not allowed'));

      expect(Result.isOk(bio)).toBe(false);
      expect(bio[1]).toStrictEqual(new Error('not allowed'));
    });

    it("can't edit account data if actor frozen", async () => {
      const nickname = await editService.editNickname(
        etag,
        testFrozenAccount.getName(),
        'new nickname',
        testFrozenAccount.getName(),
      );
      const passphrase = await editService.editPassphrase(
        etag,
        testFrozenAccount.getName(),
        'new password',
        testFrozenAccount.getName(),
      );
      const email = await editService.editEmail(
        etag,
        testFrozenAccount.getName(),
        'test@example.com',
        testFrozenAccount.getName(),
      );
      const bio = await editService.editBio(
        etag,
        testFrozenAccount.getName(),
        'new bio',
        testFrozenAccount.getName(),
      );

      expect(Result.isOk(nickname)).toBe(false);
      expect(passphrase[1]).toStrictEqual(new Error('not allowed'));

      expect(Result.isOk(email)).toBe(false);
      expect(email[1]).toStrictEqual(new Error('not allowed'));

      expect(Result.isOk(bio)).toBe(false);
      expect(bio[1]).toStrictEqual(new Error('not allowed'));
    });

    it("can't edit account data if actor not activated", async () => {
      const nickname = await editService.editNickname(
        etag,
        testNotAcvivatedAccount.getName(),
        'new nickname',
        testNotAcvivatedAccount.getName(),
      );
      const passphrase = await editService.editPassphrase(
        etag,
        testNotAcvivatedAccount.getName(),
        'new password',
        testNotAcvivatedAccount.getName(),
      );
      const email = await editService.editEmail(
        etag,
        testNotAcvivatedAccount.getName(),
        'test@example.com',
        testNotAcvivatedAccount.getName(),
      );
      const bio = await editService.editBio(
        etag,
        testNotAcvivatedAccount.getName(),
        'new bio',
        testNotAcvivatedAccount.getName(),
      );

      expect(Result.isOk(nickname)).toBe(false);
      expect(passphrase[1]).toStrictEqual(new Error('not allowed'));

      expect(Result.isOk(email)).toBe(false);
      expect(email[1]).toStrictEqual(new Error('not allowed'));

      expect(Result.isOk(bio)).toBe(false);
      expect(bio[1]).toStrictEqual(new Error('not allowed'));
    });
  });
});
