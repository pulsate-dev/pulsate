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
    const account = InactiveAccount.new(exampleInput);
    expect(account.isActivated()).toBe(false);
  });

  it('activate account', () => {
    const inactiveAccount = InactiveAccount.new(exampleInput);
    const account = inactiveAccount.activate(exampleActivateArgs);

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
    const inactiveAccount = InactiveAccount.new(exampleInput);
    inactiveAccount.activate(exampleActivateArgs);

    expect(() => {
      inactiveAccount.activate(exampleActivateArgs);
    }).toThrow();
  });

  it('get account property', () => {
    const account = InactiveAccount.new(exampleInput);

    expect(account.getID()).toBe(exampleInput.id);
    expect(account.getName()).toBe(exampleInput.name);
    expect(account.getMail()).toBe(exampleInput.mail);
  });
});
