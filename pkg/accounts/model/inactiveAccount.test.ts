import { describe, it, expect } from 'vitest';

import { type ID } from '../../id/type.js';
import { type AccountID, type CreateAccountArgs } from './account.js';
import { InactiveAccount } from './inactiveAccount.js';

const exampleInput: CreateAccountArgs = {
  id: '1' as ID<AccountID>,
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
    expect(account.isActivated).toBe(false);
  });

  it('activate account', () => {
    const inactiveAccount = InactiveAccount.new(exampleInput);
    const account = inactiveAccount.activate();

    expect(account.getID).toBe(exampleInput.id);
    expect(account.getName).toBe(exampleInput.name);
    expect(account.getMail).toBe(exampleInput.mail);
    expect(account.getNickname).toBe(exampleInput.nickname);
    expect(account.getPassphraseHash).toBe(exampleInput.passphraseHash);
    expect(account.getBio).toBe(exampleInput.bio);
    expect(account.getRole).toBe(exampleInput.role);
    // expect(account.getStatus).toBe('active'); NOTE: This line will be removed when account status was removed.
    expect(account.getCreatedAt).toBe(exampleInput.createdAt);
    expect(account.getUpdatedAt).toBe(undefined);
    expect(account.getDeletedAt).toBe(undefined);

    expect(inactiveAccount.isActivated).toBe(true);
  });

  it('already activated', () => {
    const inactiveAccount = InactiveAccount.new(exampleInput);
    inactiveAccount.activate();

    expect(() => {
      inactiveAccount.activate();
    }).toThrow();
  });

  it('get account property', () => {
    const account = InactiveAccount.new(exampleInput);

    expect(account.getID).toBe(exampleInput.id);
    expect(account.getName).toBe(exampleInput.name);
    expect(account.getMail).toBe(exampleInput.mail);
  });
});
