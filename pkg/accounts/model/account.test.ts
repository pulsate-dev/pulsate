import { assertEquals, assertThrows } from 'std/assert';
import { Account, AccountID, CreateAccountArgs } from './account.ts';
import { ID } from '../../id/type.ts';

const exampleInput: CreateAccountArgs = {
  id: '1' as ID<AccountID>,
  bio: 'this is john doe’s account!',
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

Deno.test('generate new instance', () => {
  const account = Account.new(exampleInput);

  assertEquals(account.getID, exampleInput.id);
  assertEquals(account.getName, exampleInput.name);
  assertEquals(account.getMail, exampleInput.mail);
  assertEquals(account.getNickname, exampleInput.nickname);
  assertEquals(account.getPassphraseHash, exampleInput.passphraseHash);
  assertEquals(account.getBio, exampleInput.bio);
  assertEquals(account.getRole, exampleInput.role);
  assertEquals(account.getStatus, 'notActivated');
  assertEquals(account.getCreatedAt, exampleInput.createdAt);
  assertEquals(account.getUpdatedAt, undefined);
  assertEquals(account.getDeletedAt, undefined);
});

Deno.test('account nickname must be less than 256', () => {
  const name = 'a'.repeat(257);
  const account = Account.new(exampleInput);
  assertThrows(() => {
    account.setNickName(name);
  });
});

Deno.test('account bio must be less than 1024 chars', () => {
  const bio = 'a'.repeat(1025);
  const account = Account.new(exampleInput);
  assertThrows(() => {
    account.setBio(bio);
  });
});

Deno.test('can’t change values when account is frozen', () => {
  const account = Account.new(exampleInput);
  account.setFreeze();

  assertThrows(() => {
    account.setBio('test');
  });

  assertThrows(() => {
    account.setNickName('hello@example.com');
  });

  assertThrows(() => {
    account.setPassphraseHash('123');
  });

  assertThrows(() => {
    account.setSilence();
  });

  assertThrows(() => {
    account.setMail('pulsate@example.com');
  });
});

Deno.test('deleted account can’t change values', () => {
  const account = Account.new(exampleInput);
  account.setDeletedAt(new Date());

  assertThrows(() => {
    account.setBio('test');
  });

  assertThrows(() => {
    account.setNickName('hello@example.com');
  });

  assertThrows(() => {
    account.setPassphraseHash('123');
  });

  assertThrows(() => {
    account.setSilence();
  });

  assertThrows(() => {
    account.setMail('pulsate@example.com');
  });
});
