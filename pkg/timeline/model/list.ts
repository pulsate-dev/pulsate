import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';

export type ListID = ID<List>;
export interface CreateListArgs {
  id: ListID;
  title: string;
  publicity: 'PUBLIC' | 'PRIVATE';
  ownerId: AccountID;
  memberIds: AccountID[];
  createdAt: Date;
}
export class List {
  private readonly id: ListID;
  private readonly title: string;
  private readonly publicity: 'PUBLIC' | 'PRIVATE';
  private readonly ownerId: AccountID;
  private memberIds: AccountID[];
  private readonly createdAt: Date;

  private constructor(args: CreateListArgs) {
    this.id = args.id;
    this.title = args.title;
    this.publicity = args.publicity;
    this.ownerId = args.ownerId;
    this.memberIds = args.memberIds;
    this.createdAt = args.createdAt;
  }

  static new(args: CreateListArgs) {
    return new List(args);
  }

  getId(): ListID {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  isPublic(): boolean {
    return this.publicity === 'PUBLIC';
  }

  getOwnerId(): AccountID {
    return this.ownerId;
  }

  getMemberIds(): AccountID[] {
    return this.memberIds;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  addMember(memberId: AccountID) {
    // ToDo: member limit
    if (this.memberIds.includes(memberId)) return;
    this.memberIds.push(memberId);
  }

  removeMember(memberId: AccountID) {
    this.memberIds = this.memberIds.filter((id) => id !== memberId);
  }
}
