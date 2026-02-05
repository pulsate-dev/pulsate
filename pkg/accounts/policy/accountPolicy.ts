export type AccountPolicyActionModelName =
  | 'account'
  | 'authentication'
  | 'authenticationToken'
  | 'avatar'
  | 'header'
  | 'follow'
  | 'relationship'
  | 'verifyToken';

export type AccountPolicyActionName = 'read' | 'write' | 'admin';

export type AccountPolicyActions =
  `account.${AccountPolicyActionModelName}:${AccountPolicyActionName}`;
