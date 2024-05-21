import { Option, Result } from '@mikuroxina/mini-fn';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { ID } from '../../id/type.js';
import { Argon2idPasswordEncoder } from '../../password/mod.js';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy.js';
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
      Account.new({
        id: '1' as ID<AccountID>,
        name: '@john@example.com',
        mail: 'johndoe@example.com',
        nickname: 'John Doe',
        passphraseHash: 'hash',
        bio: '',
        role: 'normal',
        frozen: 'normal',
        silenced: 'normal',
        status: 'notActivated',
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
        );

        expect(Result.isErr(updateRes)).toBe(true);
      },
    );
  });
});
