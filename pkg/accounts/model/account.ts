import type { ID } from '../../id/type.ts';
import {
  AccountAlreadyDeletedError,
  AccountAlreadyFrozenError,
  AccountBioLengthError,
  AccountDateInvalidError,
  AccountNickNameLengthError
} from './account.errors.js';

export type AccountID = string;
export type AccountName = `@${string}@${string}`;
export type AccountRole = 'admin' | 'normal' | 'moderator';
export type AccountStatus = 'active' | 'notActivated';
export type AccountFrozen = 'frozen' | 'normal';
export type AccountSilenced = 'silenced' | 'normal';

export interface CreateAccountArgs {
  id: ID<AccountID>;
  name: AccountName;
  mail: string;
  nickname: string;
  passphraseHash: string | undefined;
  bio: string;
  role: AccountRole;
  frozen: AccountFrozen;
  silenced: AccountSilenced;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date | undefined;
  deletedAt: Date | undefined;
}

export class Account {
  private constructor(arg: CreateAccountArgs) {
    this.id = arg.id;
    this.name = arg.name;
    this.mail = arg.mail;
    this.nickname = arg.nickname;
    this.passphraseHash = arg.passphraseHash;
    this.bio = arg.bio;
    this.role = arg.role;
    this.status = arg.status;
    this.frozen = arg.frozen;
    this.silenced = arg.silenced;
    this.createdAt = arg.createdAt;
    this.updatedAt = arg.updatedAt;
    this.deletedAt = arg.deletedAt;
  }

  // 不変
  private readonly id: ID<AccountID>;
  get getID(): ID<AccountID> {
    return this.id;
  }

  private readonly name: AccountName;
  get getName(): AccountName {
    return this.name;
  }

  private createdAt: Date;
  get getCreatedAt(): Date {
    return this.createdAt;
  }

  // 可変
  private mail: string;
  get getMail(): string {
    return this.mail;
  }
  public setMail(mail: string) {
    if (this.isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    if (this.getFrozen === 'frozen') {
      throw new AccountAlreadyFrozenError('account already frozen');
    }

    this.mail = mail;
  }

  private nickname: string;
  get getNickname(): string {
    return this.nickname;
  }
  public setNickName(name: string) {
    if (this.isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    if (this.getFrozen === 'frozen') {
      throw new AccountAlreadyFrozenError('account already frozen');
    }

    if ([...name].length > 256) {
      throw new AccountNickNameLengthError('nickname length is too long');
    }
    this.nickname = name;
  }

  private passphraseHash: string | undefined;
  get getPassphraseHash(): string | undefined {
    return this.passphraseHash;
  }
  public setPassphraseHash(hash: string) {
    if (this.isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    if (this.getFrozen === 'frozen') {
      throw new AccountAlreadyFrozenError('account already frozen');
    }

    this.passphraseHash = hash;
  }

  private bio: string;
  get getBio(): string {
    return this.bio;
  }
  public setBio(bio: string) {
    if (this.isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    if (this.getFrozen === 'frozen') {
      throw new AccountAlreadyFrozenError('account already frozen');
    }

    if ([...bio].length > 1024) {
      throw new AccountBioLengthError('bio is too long');
    }
    this.bio = bio;
  }

  private role: AccountRole;
  get getRole(): AccountRole {
    return this.role;
  }
  public toAdmin() {
    if (this.isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    if (this.getFrozen === 'frozen') {
      throw new AccountAlreadyFrozenError('account already frozen');
    }

    this.role = 'admin';
  }
  public toNormal() {
    if (this.isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    if (this.getFrozen === 'frozen') {
      throw new AccountAlreadyFrozenError('account already frozen');
    }

    this.role = 'normal';
  }
  public toModerator() {
    if (this.isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    if (this.getFrozen === 'frozen') {
      throw new AccountAlreadyFrozenError('account already frozen');
    }

    this.role = 'moderator';
  }

  private frozen: AccountFrozen;
  get getFrozen(): AccountFrozen {
    return this.frozen;
  }
  public setFreeze() {
    if (this.isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }

    this.frozen = 'frozen';
  }

  public setUnfreeze() {
    if (this.isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    this.frozen = 'normal';
  }

  private silenced: AccountSilenced;
  get getSilenced(): AccountSilenced {
    return this.silenced;
  }
  public setSilence() {
    if (this.isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    if (this.getFrozen === 'frozen') {
      throw new AccountAlreadyFrozenError('account already frozen');
    }

    this.silenced = 'silenced';
  }
  public undoSilence() {
    if (this.isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    if (this.getFrozen === 'frozen') {
      throw new AccountAlreadyFrozenError('account already frozen');
    }

    this.silenced = 'normal';
  }

  private status: AccountStatus;
  get getStatus(): AccountStatus {
    return this.status;
  }
  public activate() {
    if (this.isDeleted()) {
      throw new AccountAlreadyDeletedError('account already deleted');
    }
    if (this.getFrozen === 'frozen') {
      throw new AccountAlreadyFrozenError('account already frozen');
    }
    this.status = 'active';
  }

  private updatedAt: Date | undefined;
  get getUpdatedAt(): Date | undefined {
    return this.updatedAt;
  }
  public setUpdatedAt(at: Date) {
    if (this.createdAt > at) {
      throw new AccountDateInvalidError('updatedAt must be after createdAt');
    }
    this.updatedAt = at;
  }

  private deletedAt: Date | undefined;
  get getDeletedAt(): Date | undefined {
    return this.deletedAt;
  }
  public setDeletedAt(at: Date) {
    if (this.createdAt > at) {
      throw new AccountDateInvalidError('deletedAt must be after createdAt');
    }
    this.deletedAt = at;
  }

  private isDeleted(): boolean {
    if (this.deletedAt === undefined) {
      return false;
    }

    return true;
  }

  public static new(arg: Omit<CreateAccountArgs, 'deletedAt' | 'updatedAt'>) {
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
      deletedAt: undefined
    });
  }

  public reconstruct(arg: CreateAccountArgs) {
    return new Account(arg);
  }
}
