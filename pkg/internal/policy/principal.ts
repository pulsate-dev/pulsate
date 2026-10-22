/** Construct account principals only from authenticated server data. */
export type Principal<AccountID> =
  | Readonly<{ kind: 'account'; accountId: AccountID }>
  | Readonly<{ kind: 'anonymous' }>;
