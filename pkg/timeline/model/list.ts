import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';

export type ListID = ID<List>;
export type CreateListArgs = Readonly<{
  id: ListID;
  title: string;
  publicity: 'PUBLIC' | 'PRIVATE';
  ownerId: AccountID;
  memberIds: readonly AccountID[];
  createdAt: Date;
}>;

export class List {
  private readonly id: ListID;
  private title: string;
  private publicity: 'PUBLIC' | 'PRIVATE';
  private readonly ownerId: AccountID;
  private readonly memberIds: Set<AccountID>;
  private readonly createdAt: Date;

  private constructor(args: CreateListArgs) {
    this.id = args.id;
    this.title = args.title;
    this.publicity = args.publicity;
    this.ownerId = args.ownerId;
    this.memberIds = new Set<AccountID>(args.memberIds);
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

  setTitle(title: string) {
    this.title = title;
  }

  isPublic(): boolean {
    return this.publicity === 'PUBLIC';
  }

  setPublicity(publicity: 'PUBLIC' | 'PRIVATE') {
    this.publicity = publicity;
  }

  getOwnerId(): AccountID {
    return this.ownerId;
  }

  getMemberIds(): AccountID[] {
    return [...this.memberIds];
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  addMember(memberId: AccountID): void {
    // ToDo: member limit
    this.memberIds.add(memberId);
  }

  removeMember(memberId: AccountID): void {
    this.memberIds.delete(memberId);
  }
}
