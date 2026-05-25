import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { AccountID } from './account.js';
import {
  type ActivateArgs,
  type CreateInactiveAccountArgs,
  InactiveAccount,
} from './inactiveAccount.js';

const exampleInput: CreateInactiveAccountArgs = {
  id: '1' as AccountID,
  name: '@johndoe@social.example.com',
  mail: 'test@mail.example.com',
  passphraseHash: 'leknflkwnrigohidvlk',
  role: 'admin',
};

const exampleActivateArgs: ActivateArgs = {
  createdAt: new Date('2023-09-10T00:00:00.000Z'),
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
    expect(account.getNickname()).toBe('');
    expect(account.getPassphraseHash()).toBe(exampleInput.passphraseHash);
    expect(account.getBio()).toBe('');
    expect(account.getRole()).toBe(exampleInput.role);
    expect(account.getCreatedAt()).toBe(exampleActivateArgs.createdAt);
    expect(account.getUpdatedAt()).toBe(undefined);
    expect(account.getDeletedAt()).toBe(undefined);
    expect(account.isActivated()).toBe(true);

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
    expect(account.getPassphraseHash()).toBe(exampleInput.passphraseHash);
    expect(account.getRole()).toBe(exampleInput.role);
  });
});
