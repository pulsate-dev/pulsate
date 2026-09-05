import { type Option, Result } from '@mikuroxina/mini-fn';
import * as v from 'valibot';

import type { EventMeta } from '../../internal/event/type.ts';
import type { ID } from '../../internal/id/type.ts';
import {
  AccountAlreadyDeletedError,
  AccountAlreadyFrozenError,
  AccountBioLengthError,
  AccountDateInvalidError,
  AccountMailAddressLengthError,
  AccountNickNameLengthError,
  AccountPassphraseRequirementsNotMetError,
} from './account.errors.ts';
import {
  type AccountEvent,
  accountEventFactory,
} from './event/accountEvents.ts';

export type AccountID = ID<Account>;
export type AccountName = `@${string}@${string}`;
export type AccountRole = 'admin' | 'normal' | 'moderator';
export type AccountStatus = 'active' | 'notActivated';
export type AccountFrozen = 'frozen' | 'normal';
export type AccountSilenced = 'silenced' | 'normal';

export const accountNameSchema = v.pipe(
  v.string(),
  v.check((s) => {
    const parts = s.split('@');

    // must split into exactly 3 parts by "@"
    if (!((p): p is [string, string, string] => p.length === 3)(parts)) {
      return false;
    }

    const [head, name, domain] = parts;

    // must start with "@": nothing before the first "@"
    if (head.length !== 0) {
      return false;
    }

    // username: a-z A-Z 0-9 - _ . only; at least 1 char; must start with alphanumeric
    if (!/^[a-zA-Z0-9][\w\-.]*$/.test(name)) {
      return false;
    }

    // ref. RFC1035 https://www.rfc-editor.org/rfc/rfc1035#page-8
    //
    // domain: follows RFC1035 "<subdomain>"; no whitespace; character set only
    if (!/^[a-zA-Z0-9\-.]+$/.test(domain)) {
      return false;
    }

    // each label follows RFC1035 "<label>"
    for (const label of domain.split('.')) {
      if (!/^[a-zA-Z](?:.*[a-zA-Z0-9])?$/.test(label)) {
        return false;
      }
    }

    return true;
  }),
  v.transform((s) => s as AccountName),
);

const segmenter = new Intl.Segmenter();
const graphemeLength = (s: string): number => [...segmenter.segment(s)].length;

// empty string is allowed (means "no nickname set"); non-empty must be <= 256
const nicknameSchema = v.pipe(
  v.string(),
  v.check((s) => graphemeLength(s) === 0 || graphemeLength(s) <= 256),
);

export const mailSchema = v.pipe(
  v.string(),
  v.check((s) => s.length >= 7 && s.length <= 319),
);

const passphraseSchema = v.pipe(
  v.string(),
  v.check((s) => s.length >= 8 && s.length <= 512),
);

const bioSchema = v.pipe(
  v.string(),
  v.check((s) => graphemeLength(s) <= 1024),
);

export interface CreateAccountArgs {
  id: AccountID;
  name: AccountName;
  mail: string;
  nickname: string;
  passphraseHash?: string;
  bio: string;
  role: AccountRole;
  frozen: AccountFrozen;
  silenced: AccountSilenced;
  status: AccountStatus;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Account {
  private constructor(arg: CreateAccountArgs) {
    this.#id = arg.id;
    this.#name = arg.name;
    this.#mail = arg.mail;
    this.#nickname = arg.nickname;
    this.#passphraseHash = arg.passphraseHash;
    this.#bio = arg.bio;
    this.#role = arg.role;
    this.#status = arg.status;
    this.#frozen = arg.frozen;
    this.#silenced = arg.silenced;
    this.#createdAt = arg.createdAt;
    this.#updatedAt = arg.updatedAt;
    this.#deletedAt = arg.deletedAt;
  }

  readonly #id: AccountID;
  readonly #name: AccountName;
  readonly #createdAt: Date;
  #nickname: string;
  #bio: string;
  #mail: string;
  #frozen: AccountFrozen;
  #role: AccountRole;
  #passphraseHash?: string;
  #silenced: AccountSilenced;
  #status: AccountStatus;
  #updatedAt?: Date;
  #deletedAt?: Date;
  #events: AccountEvent[] = [];

  pullEvents(): AccountEvent[] {
    return this.#events.splice(0);
  }

  // get methods
  getID(): AccountID {
    return this.#id;
  }

  getName(): AccountName {
    return this.#name;
  }

  getCreatedAt(): Date {
    return this.#createdAt;
  }

  getMail(): string {
    return this.#mail;
  }

  getNickname(): string {
    return this.#nickname;
  }

  getPassphraseHash(): string | undefined {
    return this.#passphraseHash;
  }

  getBio(): string {
    return this.#bio;
  }

  getRole(): AccountRole {
    return this.#role;
  }

  isFrozen(): boolean {
    return this.#frozen === 'frozen';
  }

  isSilenced(): boolean {
    return this.#silenced === 'silenced';
  }

  isActivated(): boolean {
    return this.#status === 'active';
  }

  getUpdatedAt(): Date | undefined {
    return this.#updatedAt;
  }

  getDeletedAt(): Date | undefined {
    return this.#deletedAt;
  }

  // mutation methods
  setMail(
    mail: string,
    meta: EventMeta<AccountID>,
  ): Result.Result<
    | AccountAlreadyDeletedError
    | AccountAlreadyFrozenError
    | AccountMailAddressLengthError
    | Error,
    void
  > {
    if (this.#isDeleted()) {
      return Result.err(
        new AccountAlreadyDeletedError('account already deleted'),
      );
    }
    if (this.isFrozen()) {
      return Result.err(
        new AccountAlreadyFrozenError('account already frozen'),
      );
    }

    if (!v.safeParse(mailSchema, mail).success) {
      return Result.err(
        new AccountMailAddressLengthError(
          'mail address length is out of range',
        ),
      );
    }

    const event = accountEventFactory.emailUpdated(meta.idGenerator, {
      target: this.#id,
      actor: meta.actor,
      occurredAt: meta.occurredAt,
      mail,
    });
    if (Result.isErr(event)) {
      return event;
    }

    this.#mail = mail;
    this.#events.push(Result.unwrap(event));
    return Result.ok(undefined);
  }

  setNickName(
    name: string,
    meta: EventMeta<AccountID>,
  ): Result.Result<
    | AccountAlreadyDeletedError
    | AccountAlreadyFrozenError
    | AccountNickNameLengthError
    | Error,
    void
  > {
    if (this.#isDeleted()) {
      return Result.err(
        new AccountAlreadyDeletedError('account already deleted'),
      );
    }
    if (this.isFrozen()) {
      return Result.err(
        new AccountAlreadyFrozenError('account already frozen'),
      );
    }

    if (!v.safeParse(nicknameSchema, name).success) {
      return Result.err(
        new AccountNickNameLengthError('nickname length is too long'),
      );
    }

    const event = accountEventFactory.nicknameUpdated(meta.idGenerator, {
      target: this.#id,
      actor: meta.actor,
      occurredAt: meta.occurredAt,
      nickname: name,
    });
    if (Result.isErr(event)) {
      return event;
    }

    this.#nickname = name;
    this.#events.push(Result.unwrap(event));
    return Result.ok(undefined);
  }

  setPassphraseHash(
    hash: string,
  ): Result.Result<
    AccountAlreadyDeletedError | AccountAlreadyFrozenError,
    void
  > {
    if (this.#isDeleted()) {
      return Result.err(
        new AccountAlreadyDeletedError('account already deleted'),
      );
    }
    if (this.isFrozen()) {
      return Result.err(
        new AccountAlreadyFrozenError('account already frozen'),
      );
    }

    this.#passphraseHash = hash;
    return Result.ok(undefined);
  }

  setBio(
    bio: string,
    meta: EventMeta<AccountID>,
  ): Result.Result<
    | AccountAlreadyDeletedError
    | AccountAlreadyFrozenError
    | AccountBioLengthError
    | Error,
    void
  > {
    if (this.#isDeleted()) {
      return Result.err(
        new AccountAlreadyDeletedError('account already deleted'),
      );
    }
    if (this.isFrozen()) {
      return Result.err(
        new AccountAlreadyFrozenError('account already frozen'),
      );
    }

    if (!v.safeParse(bioSchema, bio).success) {
      return Result.err(new AccountBioLengthError('bio is too long'));
    }

    const event = accountEventFactory.bioUpdated(meta.idGenerator, {
      target: this.#id,
      actor: meta.actor,
      occurredAt: meta.occurredAt,
      bio,
    });
    if (Result.isErr(event)) {
      return event;
    }

    this.#bio = bio;
    this.#events.push(Result.unwrap(event));
    return Result.ok(undefined);
  }

  toAdmin(): Result.Result<
    AccountAlreadyDeletedError | AccountAlreadyFrozenError,
    void
  > {
    if (this.#isDeleted()) {
      return Result.err(
        new AccountAlreadyDeletedError('account already deleted'),
      );
    }
    if (this.isFrozen()) {
      return Result.err(
        new AccountAlreadyFrozenError('account already frozen'),
      );
    }

    this.#role = 'admin';
    return Result.ok(undefined);
  }
  toNormal(): Result.Result<
    AccountAlreadyDeletedError | AccountAlreadyFrozenError,
    void
  > {
    if (this.#isDeleted()) {
      return Result.err(
        new AccountAlreadyDeletedError('account already deleted'),
      );
    }
    if (this.isFrozen()) {
      return Result.err(
        new AccountAlreadyFrozenError('account already frozen'),
      );
    }

    this.#role = 'normal';
    return Result.ok(undefined);
  }
  toModerator(): Result.Result<
    AccountAlreadyDeletedError | AccountAlreadyFrozenError,
    void
  > {
    if (this.#isDeleted()) {
      return Result.err(
        new AccountAlreadyDeletedError('account already deleted'),
      );
    }
    if (this.isFrozen()) {
      return Result.err(
        new AccountAlreadyFrozenError('account already frozen'),
      );
    }

    this.#role = 'moderator';
    return Result.ok(undefined);
  }

  setFreeze(
    meta: EventMeta<AccountID>,
  ): Result.Result<
    AccountAlreadyDeletedError | AccountAlreadyFrozenError | Error,
    void
  > {
    if (this.#isDeleted()) {
      return Result.err(
        new AccountAlreadyDeletedError('account already deleted'),
      );
    }

    const event = accountEventFactory.adminFrozen(meta.idGenerator, {
      target: this.#id,
      actor: meta.actor,
      occurredAt: meta.occurredAt,
    });
    if (Result.isErr(event)) {
      return event;
    }

    this.#frozen = 'frozen';
    this.#events.push(Result.unwrap(event));
    return Result.ok(undefined);
  }

  setUnfreeze(
    meta: EventMeta<AccountID>,
  ): Result.Result<
    AccountAlreadyDeletedError | AccountAlreadyFrozenError | Error,
    void
  > {
    if (this.#isDeleted()) {
      return Result.err(
        new AccountAlreadyDeletedError('account already deleted'),
      );
    }

    const event = accountEventFactory.adminUnfrozen(meta.idGenerator, {
      target: this.#id,
      actor: meta.actor,
      occurredAt: meta.occurredAt,
    });
    if (Result.isErr(event)) {
      return event;
    }

    this.#frozen = 'normal';
    this.#events.push(Result.unwrap(event));
    return Result.ok(undefined);
  }

  setSilence(
    meta: EventMeta<AccountID>,
  ): Result.Result<
    AccountAlreadyDeletedError | AccountAlreadyFrozenError | Error,
    void
  > {
    if (this.#isDeleted()) {
      return Result.err(
        new AccountAlreadyDeletedError('account already deleted'),
      );
    }
    if (this.isFrozen()) {
      return Result.err(
        new AccountAlreadyFrozenError('account already frozen'),
      );
    }

    const event = accountEventFactory.adminSilenced(meta.idGenerator, {
      target: this.#id,
      actor: meta.actor,
      occurredAt: meta.occurredAt,
    });
    if (Result.isErr(event)) {
      return event;
    }

    this.#silenced = 'silenced';
    this.#events.push(Result.unwrap(event));
    return Result.ok(undefined);
  }
  undoSilence(
    meta: EventMeta<AccountID>,
  ): Result.Result<
    AccountAlreadyDeletedError | AccountAlreadyFrozenError | Error,
    void
  > {
    if (this.#isDeleted()) {
      return Result.err(
        new AccountAlreadyDeletedError('account already deleted'),
      );
    }
    if (this.isFrozen()) {
      return Result.err(
        new AccountAlreadyFrozenError('account already frozen'),
      );
    }

    const event = accountEventFactory.adminUnsilenced(meta.idGenerator, {
      target: this.#id,
      actor: meta.actor,
      occurredAt: meta.occurredAt,
    });
    if (Result.isErr(event)) {
      return event;
    }

    this.#silenced = 'normal';
    this.#events.push(Result.unwrap(event));
    return Result.ok(undefined);
  }

  activate(
    meta: EventMeta<Option.Option<AccountID>>,
  ): Result.Result<
    AccountAlreadyDeletedError | AccountAlreadyFrozenError | Error,
    void
  > {
    if (this.#isDeleted()) {
      return Result.err(
        new AccountAlreadyDeletedError('account already deleted'),
      );
    }
    if (this.isFrozen()) {
      return Result.err(
        new AccountAlreadyFrozenError('account already frozen'),
      );
    }

    const event = accountEventFactory.activated(meta.idGenerator, {
      target: this.#id,
      actor: meta.actor,
      occurredAt: meta.occurredAt,
    });
    if (Result.isErr(event)) {
      return event;
    }

    this.#status = 'active';
    this.#events.push(Result.unwrap(event));
    return Result.ok(undefined);
  }

  setUpdatedAt(
    at: Date,
  ): Result.Result<
    | AccountAlreadyDeletedError
    | AccountAlreadyFrozenError
    | AccountDateInvalidError,
    void
  > {
    if (this.#isDeleted()) {
      return Result.err(
        new AccountAlreadyDeletedError('account already deleted'),
      );
    }
    if (this.isFrozen()) {
      return Result.err(
        new AccountAlreadyFrozenError('account already frozen'),
      );
    }
    if (this.#createdAt > at) {
      return Result.err(
        new AccountDateInvalidError('updatedAt must be after createdAt'),
      );
    }
    this.#updatedAt = at;
    return Result.ok(undefined);
  }

  setDeletedAt(at: Date): Result.Result<AccountDateInvalidError, void> {
    if (this.#createdAt > at) {
      return Result.err(
        new AccountDateInvalidError('deletedAt must be after createdAt'),
      );
    }
    this.#deletedAt = at;
    return Result.ok(undefined);
  }

  #isDeleted(): boolean {
    return this.#deletedAt !== undefined;
  }

  static new(
    arg: Omit<
      CreateAccountArgs,
      'deletedAt' | 'updatedAt' | 'frozen' | 'silenced' | 'status'
    >,
    meta: EventMeta<Option.Option<AccountID>>,
  ): Result.Result<Error, Account> {
    const event = accountEventFactory.registered(meta.idGenerator, {
      target: arg.id,
      actor: meta.actor,
      occurredAt: meta.occurredAt,
      mail: arg.mail,
    });
    if (Result.isErr(event)) {
      return event;
    }

    const account = new Account({
      id: arg.id,
      mail: arg.mail,
      name: arg.name,
      createdAt: arg.createdAt,
      bio: arg.bio,
      nickname: arg.nickname,
      passphraseHash: arg.passphraseHash,
      role: arg.role,
      status: 'notActivated',
      frozen: 'normal',
      silenced: 'normal',
      updatedAt: undefined,
      deletedAt: undefined,
    });
    account.#events.push(Result.unwrap(event));
    return Result.ok(account);
  }

  static validatePassphrase(
    passphrase: string,
  ): Result.Result<AccountPassphraseRequirementsNotMetError, void> {
    if (!v.safeParse(passphraseSchema, passphrase).success) {
      return Result.err(
        new AccountPassphraseRequirementsNotMetError(
          'passphrase requirements not met',
        ),
      );
    }
    return Result.ok(undefined);
  }

  static reconstruct(arg: CreateAccountArgs) {
    return new Account(arg);
  }
}
