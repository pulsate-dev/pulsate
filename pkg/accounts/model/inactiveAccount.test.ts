import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import { MockClock, SnowflakeIDGenerator } from '../../internal/id/mod.ts';
import type { AccountID } from './account.ts';
import {
  type ActivateArgs,
  type CreateInactiveAccountArgs,
  InactiveAccount,
} from './inactiveAccount.ts';

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

const idGenerator = new SnowflakeIDGenerator(
  1,
  new MockClock(new Date('2023-09-10T00:00:00.000Z')),
);
const occurredAt = new Date('2023-09-10T00:00:00.000Z');
const systemMeta = () => ({
  idGenerator,
  actor: Option.none(),
  occurredAt,
});

const newInactiveAccount = () =>
  Result.unwrap(InactiveAccount.new(exampleInput, systemMeta()));

describe('InactiveAccount', () => {
  it('generate new instance', () => {
    const account = newInactiveAccount();
    expect(account.isActivated()).toBe(false);
  });

  it('fail to create with too short mail', () => {
    const result = InactiveAccount.new(
      {
        ...exampleInput,
        mail: 'a@b.c',
      },
      systemMeta(),
    );
    expect(Result.isErr(result)).toBe(true);
  });

  it('fail to create with too long mail', () => {
    const result = InactiveAccount.new(
      {
        ...exampleInput,
        mail: `${'a'.repeat(320)}@example.com`,
      },
      systemMeta(),
    );
    expect(Result.isErr(result)).toBe(true);
  });

  it('activate account', () => {
    const inactiveAccount = newInactiveAccount();
    const account = Result.unwrap(
      inactiveAccount.activate(exampleActivateArgs, systemMeta()),
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
    const inactiveAccount = newInactiveAccount();
    inactiveAccount.activate(exampleActivateArgs, systemMeta());

    const result = inactiveAccount.activate(exampleActivateArgs, systemMeta());
    expect(Result.isErr(result)).toBe(true);
  });

  it('get account property', () => {
    const account = newInactiveAccount();

    expect(account.getID()).toBe(exampleInput.id);
    expect(account.getName()).toBe(exampleInput.name);
    expect(account.getMail()).toBe(exampleInput.mail);
    expect(account.getPassphraseHash()).toBe(exampleInput.passphraseHash);
    expect(account.getRole()).toBe(exampleInput.role);
  });
});

describe('InactiveAccount domain events', () => {
  it('new() generates an account.registered event', () => {
    const account = newInactiveAccount();
    const events = account.pullEvents();

    expect(events).toHaveLength(1);
    const [event] = events;
    expect(event?.eventName).toBe('account.registered');
    expect(event?.target).toBe(account.getID());
    expect(event?.actor).toStrictEqual(Option.none());
    expect(event?.payload).toStrictEqual({ mail: exampleInput.mail });
  });

  it('new() does not create an account when event generation fails', () => {
    const brokenIDGenerator = new SnowflakeIDGenerator(
      1,
      new MockClock(new Date('2020-01-01T00:00:00.000Z')),
    );

    const result = InactiveAccount.new(exampleInput, {
      idGenerator: brokenIDGenerator,
      actor: Option.none(),
      occurredAt,
    });

    expect(Result.isErr(result)).toBe(true);
  });

  it('pullEvents() is destructive', () => {
    const account = newInactiveAccount();
    expect(account.pullEvents()).toHaveLength(1);
    expect(account.pullEvents()).toStrictEqual([]);
  });

  it('activate() delegates the account.activated event to the Account it returns', () => {
    const inactiveAccount = newInactiveAccount();
    inactiveAccount.pullEvents();

    const account = Result.unwrap(
      inactiveAccount.activate(exampleActivateArgs, systemMeta()),
    );

    expect(inactiveAccount.pullEvents()).toStrictEqual([]);

    const events = account.pullEvents();
    expect(events).toHaveLength(1);
    const [event] = events;
    expect(event?.eventName).toBe('account.activated');
    expect(event?.target).toBe(account.getID());
  });

  it('activate() does not push an event when already activated', () => {
    const inactiveAccount = newInactiveAccount();
    inactiveAccount.pullEvents();
    inactiveAccount.activate(exampleActivateArgs, systemMeta());

    const result = inactiveAccount.activate(exampleActivateArgs, systemMeta());
    expect(Result.isErr(result)).toBe(true);
  });
});
