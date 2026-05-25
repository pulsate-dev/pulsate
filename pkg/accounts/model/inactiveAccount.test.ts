import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID, CreateAccountArgs } from './account.js';
import {
  type CreateInactiveAccountArgs,
  InactiveAccount,
} from './inactiveAccount.js';

const exampleInput: CreateInactiveAccountArgs = {
  id: '1' as AccountID,
  name: '@johndoe@social.example.com',
  mail: 'test@mail.example.com',
};

const exampleActivateArgs: CreateAccountArgs = {
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

describe('InactiveAccount', () => {
  it('generate new instance', () => {
    const account = Result.unwrap(InactiveAccount.new(exampleInput));
    expect(account.isActivated()).toBe(false);
  });

  it('fail to create with too short mail', () => {
    const result = InactiveAccount.new({
      ...exampleInput,
      mail: 'a@b.c',
    });
    expect(Result.isErr(result)).toBe(true);
  });

  it('fail to create with too long mail', () => {
    const result = InactiveAccount.new({
      ...exampleInput,
      mail: `${'a'.repeat(320)}@example.com`,
    });
    expect(Result.isErr(result)).toBe(true);
  });

  it('activate account', () => {
    const inactiveAccount = Result.unwrap(InactiveAccount.new(exampleInput));
    const account = Result.unwrap(
      inactiveAccount.activate(exampleActivateArgs),
    );

    expect(account.getID()).toBe(exampleInput.id);
    expect(account.getName()).toBe(exampleInput.name);
    expect(account.getMail()).toBe(exampleInput.mail);
    expect(account.getNickname()).toBe(exampleActivateArgs.nickname);
    expect(account.getPassphraseHash()).toBe(
      exampleActivateArgs.passphraseHash,
    );
    expect(account.getBio()).toBe(exampleActivateArgs.bio);
    expect(account.getRole()).toBe(exampleActivateArgs.role);
    expect(account.getCreatedAt()).toBe(exampleActivateArgs.createdAt);
    expect(account.getUpdatedAt()).toBe(undefined);
    expect(account.getDeletedAt()).toBe(undefined);

    expect(inactiveAccount.isActivated()).toBe(true);
  });

  it('already activated', () => {
    const inactiveAccount = Result.unwrap(InactiveAccount.new(exampleInput));
    inactiveAccount.activate(exampleActivateArgs);

    const result = inactiveAccount.activate(exampleActivateArgs);
    expect(Result.isErr(result)).toBe(true);
  });

  it('get account property', () => {
    const account = Result.unwrap(InactiveAccount.new(exampleInput));

    expect(account.getID()).toBe(exampleInput.id);
    expect(account.getName()).toBe(exampleInput.name);
    expect(account.getMail()).toBe(exampleInput.mail);
  });
});
