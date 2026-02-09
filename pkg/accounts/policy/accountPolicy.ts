import { Result } from '@mikuroxina/mini-fn';
import type {
  Policy,
  PolicyArgs,
  PolicyAuthorizedActionFunc,
} from '../../policy/policy.js';
import { accountModuleLogger } from '../adaptor/logger.js';
import { AccountAlreadyFrozenError } from '../model/account.errors.js';
import type { Account } from '../model/account.js';
import { AccountInsufficientPermissionError } from '../model/errors.js';

export type AccountPolicyActionModelName =
  | 'account'
  | 'avatar'
  | 'header'
  | 'relationship';

export type AccountPolicyActionName = 'read' | 'write' | 'admin';

export type AccountPolicyActions =
  `account.${AccountPolicyActionModelName}:${AccountPolicyActionName}`;

export type AccountPolicyArgs = PolicyArgs<AccountPolicyActions, Account>;

export const AccountPolicy: Policy<AccountPolicyArgs> = {
  withCheck<Target, Res>(
    target: Target,
  ): (
    args: AccountPolicyArgs,
    fn: (target: Target) => Promise<Result.Result<Error, Res>>,
  ) => Promise<Result.Result<Error, Res>> {
    return async (
      args: AccountPolicyArgs,
      fn: PolicyAuthorizedActionFunc<Target, Res>,
    ): Promise<Result.Result<Error, Res>> => {
      // NOTE: Common check for all actions
      if (args.actor.isFrozen()) {
        return Result.err(
          new AccountAlreadyFrozenError('Actor frozen', {
            cause: args.actor.getID(),
          }),
        );
      }

      // NOTE: Action-specific checks
      switch (args.action) {
        case 'account.account:read': {
          // NOTE: Account is public info, no check needed
          break;
        }
        case 'account.avatar:read': {
          // NOTE: Account avatar is public info, no check needed
          break;
        }
        case 'account.header:read': {
          // NOTE: Account header is public info, no check needed
          break;
        }

        // Write actions
        case 'account.account:write': {
          // Allow if actor is the resource owner
          if (args.actor.getID() === args.resource.getID()) {
            break;
          }

          // Admin can modify other activated accounts
          if (args.actor.getRole() === 'admin' && args.resource.isActivated()) {
            accountModuleLogger.info(
              'Policy Bypassing',
              accountPolicyErrorCauseFactory(args),
            );
            break;
          }

          return Result.err(
            new AccountInsufficientPermissionError(
              'Cannot modify other account',
              accountPolicyErrorCauseFactory(args),
            ),
          );
        }
        case 'account.avatar:write': {
          if (args.actor.getID() === args.resource.getID()) {
            break;
          }

          // NOTE: if admin, can modify avatar of activated accounts
          if (args.actor.getRole() === 'admin' && args.resource.isActivated()) {
            accountModuleLogger.info(
              'Policy Bypassing',
              accountPolicyErrorCauseFactory(args),
            );
            break;
          }

          return Result.err(
            new AccountInsufficientPermissionError(
              'Cannot modify other account avatar',
              accountPolicyErrorCauseFactory(args),
            ),
          );
        }
        case 'account.header:write': {
          // Allow if actor is the resource owner
          if (args.actor.getID() === args.resource.getID()) {
            break;
          }

          // Admin can modify other activated accounts
          if (args.actor.getRole() === 'admin' && args.resource.isActivated()) {
            accountModuleLogger.info(
              'Policy Bypassing',
              accountPolicyErrorCauseFactory(args),
            );
            break;
          }

          return Result.err(
            new AccountInsufficientPermissionError(
              'Cannot modify other account header',
              accountPolicyErrorCauseFactory(args),
            ),
          );
        }
        case 'account.relationship:write': {
          // Allow if actor is the resource owner
          if (args.actor.getID() === args.resource.getID()) {
            break;
          }

          // Admin can modify other activated accounts
          if (args.actor.getRole() === 'admin' && args.resource.isActivated()) {
            accountModuleLogger.info(
              'Policy Bypassing',
              accountPolicyErrorCauseFactory(args),
            );
            break;
          }

          return Result.err(
            new AccountInsufficientPermissionError(
              'Cannot modify other account relationship',
              accountPolicyErrorCauseFactory(args),
            ),
          );
        }

        // Admin actions
        case 'account.account:admin': {
          if (args.actor.getRole() !== 'admin') {
            return Result.err(
              new AccountInsufficientPermissionError(
                'Only admin can perform admin actions',
                accountPolicyErrorCauseFactory(args),
              ),
            );
          }
          break;
        }
        case 'account.avatar:admin': {
          if (args.actor.getRole() !== 'admin') {
            return Result.err(
              new AccountInsufficientPermissionError(
                'Only admin can perform admin actions',
                accountPolicyErrorCauseFactory(args),
              ),
            );
          }
          break;
        }
        case 'account.header:admin': {
          if (args.actor.getRole() !== 'admin') {
            return Result.err(
              new AccountInsufficientPermissionError(
                'Only admin can perform admin actions',
                accountPolicyErrorCauseFactory(args),
              ),
            );
          }
          break;
        }
        case 'account.relationship:admin': {
          if (args.actor.getRole() !== 'admin') {
            return Result.err(
              new AccountInsufficientPermissionError(
                'Only admin can perform admin actions',
                accountPolicyErrorCauseFactory(args),
              ),
            );
          }
          break;
        }

        // NOTE: Relationship is private information
        case 'account.relationship:read': {
          if (args.actor.getID() === args.resource.getID()) {
            break;
          }

          if (args.actor.getRole() === 'admin' && args.resource.isActivated()) {
            accountModuleLogger.info(
              'Policy Bypassing',
              accountPolicyErrorCauseFactory(args),
            );
            break;
          }

          return Result.err(
            new AccountInsufficientPermissionError(
              'Cannot read other account relationship',
              accountPolicyErrorCauseFactory(args),
            ),
          );
        }

        default: {
          const _exhaustiveCheck: never = args.action;
          throw new Error(`Unhandled action: ${_exhaustiveCheck}`);
        }
      }

      return await fn(target);
    };
  },
} as const;

function accountPolicyErrorCauseFactory(args: AccountPolicyArgs): {
  cause: unknown;
} {
  return {
    cause: {
      actor: args.actor.getID(),
      action: args.action,
      resource: args.resource.getID(),
    },
  };
}
