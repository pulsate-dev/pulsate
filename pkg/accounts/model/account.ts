import { ID } from '../../id/type.ts';

export type AccountID = string;
export interface CreateAccountArgs {
  id: ID<AccountID>;
  name: string,
  mail: string,
  nickname: string
  passphraseHash: string | null
  bio: string,
  role: number
  status: number
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date
}


export class Account {
  private readonly id: ID<AccountID>;
  private readonly name: string;
  private readonly mail: string;
  private nickname: string;
  private passphraseHash: string | null;
  private bio: string;
  private role: number;
  private status: number;
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date;

  constructor(arg: CreateAccountArgs) {
    this.id = arg.id
    this.name = arg.name
    this.mail = arg.mail
    this.nickname = arg.nickname
    this.passphraseHash = arg.passphraseHash
    this.bio = arg.bio
    this.role = arg.role
    this.status = arg.status
    this.createdAt = arg.createdAt
    this.updatedAt = arg.updatedAt
    this.deletedAt = arg.deletedAt
  }


}
