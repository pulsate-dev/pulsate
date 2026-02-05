export type AccountPolicyActionModelName =
  | 'account'
  | 'avatar'
  | 'header'
  | 'relationship';

export type AccountPolicyActionName = 'read' | 'write' | 'admin';

export type AccountPolicyActions =
  `account.${AccountPolicyActionModelName}:${AccountPolicyActionName}`;
