import { Result } from '@mikuroxina/mini-fn';
import * as v from 'valibot';

import type { ID } from '../../id/type.js';
import {
  AccountAlreadyDeletedError,
  AccountAlreadyFrozenError,
  AccountBioLengthError,
  AccountDateInvalidError,
  AccountNickNameLengthError,
} from './account.errors.js';

export type AccountID = ID<Account>;
export type AccountName = `@${string}@${string}`;
export type AccountRole = 'admin' | 'normal' | 'moderator';
export type AccountStatus = 'active' | 'notActivated';
export type AccountFrozen = 'frozen' | 'normal';
export type AccountSilenced = 'silenced' | 'normal';

export const AccountNameSchema = v.pipe(
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

const nicknameSchema = v.pipe(
  v.string(),
  v.check((s) => graphemeLength(s) <= 256),
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

    this.#mail = mail;
    return Result.ok(undefined);
  }

  setNickName(
    name: string,
  ): Result.Result<
    | AccountAlreadyDeletedError
    | AccountAlreadyFrozenError
    | AccountNickNameLengthError,
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

    this.#nickname = name;
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
  ): Result.Result<
    | AccountAlreadyDeletedError
    | AccountAlreadyFrozenError
    | AccountBioLengthError,
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
    this.#bio = bio;
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

  setFreeze(): Result.Result<
    AccountAlreadyDeletedError | AccountAlreadyFrozenError,
    void
  > {
    if (this.#isDeleted()) {
      return Result.err(
        new AccountAlreadyDeletedError('account already deleted'),
      );
    }

    this.#frozen = 'frozen';
    return Result.ok(undefined);
  }

  setUnfreeze(): Result.Result<
    AccountAlreadyDeletedError | AccountAlreadyFrozenError,
    void
  > {
    if (this.#isDeleted()) {
      return Result.err(
        new AccountAlreadyDeletedError('account already deleted'),
      );
    }
    this.#frozen = 'normal';
    return Result.ok(undefined);
  }

  setSilence(): Result.Result<
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

    this.#silenced = 'silenced';
    return Result.ok(undefined);
  }
  undoSilence(): Result.Result<
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

    this.#silenced = 'normal';
    return Result.ok(undefined);
  }

  activate(): Result.Result<
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
    this.#status = 'active';
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

  static new(arg: Omit<CreateAccountArgs, 'deletedAt' | 'updatedAt'>) {
    return new Account({
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
  }

  static reconstruct(arg: CreateAccountArgs) {
    return new Account(arg);
  }
}
