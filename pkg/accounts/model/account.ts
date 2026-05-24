import { z } from '@hono/zod-openapi';

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

export const AccountNameSchema = z
  .string()
  .refine((s) => {
    const parts = s.split('@');

    // check. @ 区切りで 3 つの文字列に区切ることが出来る
    if (!((p): p is [string, string, string] => p.length === 3)(parts)) {
      return false;
    }

    const [head, name, domain] = parts;

    // check. 最初の文字は @, 最初の @ の手前は空文字
    if (head.length !== 0) {
      return false;
    }

    // check. 名前は a-z A-Z 0-9 - _ . のみ許容
    //        但し 1 文字以上, 最初の文字は記号非許容
    if (!/^[a-zA-Z0-9][\w\-.]*$/.test(name)) {
      return false;
    }

    // ref. RFC1035 https://www.rfc-editor.org/rfc/rfc1035#page-8
    //
    // check. ドメイン名は RFC1035 より "<subdomain>" を参照, 空白は許容しない
    //        ここでは文字種の検証のみ
    if (!/^[a-zA-Z0-9\-.]+$/.test(domain)) {
      return false;
    }

    // check. RFC1035 より "<label>" を参照
    for (const label of domain.split('.')) {
      if (!/^[a-zA-Z](?:.*[a-zA-Z0-9])?$/.test(label)) {
        return false;
      }
    }

    return true;
  })
  .transform((s) => s as AccountName);

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
  setMail(mail: string) {
    if (this.#isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    if (this.isFrozen()) {
      throw new AccountAlreadyFrozenError('account already frozen');
    }

    this.#mail = mail;
  }

  setNickName(name: string) {
    if (this.#isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    if (this.isFrozen()) {
      throw new AccountAlreadyFrozenError('account already frozen');
    }

    if ([...name].length > 256) {
      throw new AccountNickNameLengthError('nickname length is too long');
    }
    this.#nickname = name;
  }

  setPassphraseHash(hash: string) {
    if (this.#isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    if (this.isFrozen()) {
      throw new AccountAlreadyFrozenError('account already frozen');
    }

    this.#passphraseHash = hash;
  }

  setBio(bio: string) {
    if (this.#isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    if (this.isFrozen()) {
      throw new AccountAlreadyFrozenError('account already frozen');
    }

    if ([...bio].length > 1024) {
      throw new AccountBioLengthError('bio is too long');
    }
    this.#bio = bio;
  }

  toAdmin() {
    if (this.#isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    if (this.isFrozen()) {
      throw new AccountAlreadyFrozenError('account already frozen');
    }

    this.#role = 'admin';
  }
  toNormal() {
    if (this.#isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    if (this.isFrozen()) {
      throw new AccountAlreadyFrozenError('account already frozen');
    }

    this.#role = 'normal';
  }
  toModerator() {
    if (this.#isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    if (this.isFrozen()) {
      throw new AccountAlreadyFrozenError('account already frozen');
    }

    this.#role = 'moderator';
  }

  setFreeze() {
    if (this.#isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }

    this.#frozen = 'frozen';
  }

  setUnfreeze() {
    if (this.#isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    this.#frozen = 'normal';
  }

  setSilence() {
    if (this.#isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    if (this.isFrozen()) {
      throw new AccountAlreadyFrozenError('account already frozen');
    }

    this.#silenced = 'silenced';
  }
  undoSilence() {
    if (this.#isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    if (this.isFrozen()) {
      throw new AccountAlreadyFrozenError('account already frozen');
    }

    this.#silenced = 'normal';
  }

  activate() {
    if (this.#isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    if (this.isFrozen()) {
      throw new AccountAlreadyFrozenError('account already frozen');
    }
    this.#status = 'active';
  }

  setUpdatedAt(at: Date) {
    if (this.#createdAt > at) {
      throw new AccountDateInvalidError('updatedAt must be after createdAt');
    }
    this.#updatedAt = at;
  }

  setDeletedAt(at: Date) {
    if (this.#createdAt > at) {
      throw new AccountDateInvalidError('deletedAt must be after createdAt');
    }
    this.#deletedAt = at;
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
