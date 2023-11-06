import { ID } from '../../id/type.ts';
import {
  AccountBioLengthError,
  AccountDateInvalidError,
  AccountNickNameLengthError,
} from './account.errors.ts';

export type AccountID = string;

export interface CreateAccountArgs {
  id: ID<AccountID>;
  name: string;
  mail: string;
  nickname: string;
  passphraseHash: string | undefined;
  bio: string;
  role: number;
  status: number;
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
    this.createdAt = arg.createdAt;
    this.updatedAt = arg.updatedAt;
    this.deletedAt = arg.deletedAt;
  }

  // 不変
  private readonly id: ID<AccountID>;
  get getID(): ID<AccountID> {
    return this.id;
  }

  private readonly name: string;
  get getName(): string {
    return this.name;
  }

  private readonly mail: string;
  get getMail(): string {
    return this.mail;
  }

  private createdAt: Date;
  get getCreatedAt(): Date {
    return this.createdAt;
  }

  // 可変
  private nickname: string;
  get getNickname(): string {
    return this.nickname;
  }
  private setNickName(name: string) {
    if ([...name].length > 128) {
      throw new AccountNickNameLengthError('nickname length is too long');
    }
    this.nickname = name;
  }

  private passphraseHash: string | undefined;
  get getPassphraseHash(): string | undefined {
    return this.passphraseHash;
  }
  private set setPassphraseHash(hash: string | undefined) {
    this.passphraseHash = hash;
  }

  private bio: string;
  get getBio(): string {
    return this.bio;
  }
  private set setBio(bio: string) {
    if ([...bio].length > 1024) {
      throw new AccountBioLengthError('bio is too long');
    }
    this.bio = bio;
  }

  // TODO: role, status は enum にしたい
  private role: number;
  get getRole(): number {
    return this.role;
  }
  private set setRole(role: number) {
    this.role = role;
  }

  private status: number;
  get getStatus(): number {
    return this.status;
  }
  private set setStatus(status: number) {
    this.status = status;
  }

  private updatedAt: Date | undefined;
  get getUpdatedAt(): Date | undefined {
    return this.updatedAt;
  }
  private set setUpdatedAt(at: Date) {
    if (this.createdAt > at) {
      throw new AccountDateInvalidError('updatedAt must be after createdAt');
    }
    this.updatedAt = at;
  }

  private deletedAt: Date | undefined;
  get getDeletedAt(): Date | undefined {
    return this.deletedAt;
  }
  private set setDeletedAt(at: Date) {
    if (this.createdAt > at) {
      throw new AccountDateInvalidError('deletedAt must be after createdAt');
    }
    this.deletedAt = at;
  }

  public new(arg: Omit<CreateAccountArgs, 'deletedAt' | 'updatedAt'>) {
    return new Account({
      id: arg.id,
      mail: arg.mail,
      name: arg.name,
      createdAt: arg.createdAt,
      bio: arg.bio,
      nickname: arg.nickname,
      passphraseHash: arg.passphraseHash,
      role: arg.role,
      status: arg.status,
      updatedAt: undefined,
      deletedAt: undefined,
    });
  }

  public reconstruct(arg: CreateAccountArgs) {
    return new Account(arg);
  }
}
