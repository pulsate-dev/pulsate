import type { Result } from '@mikuroxina/mini-fn';
import type { Account } from '../../accounts/model/account.ts';

export type PolicyAuthorizedActionFunc<T, R> = (
  target: T,
) => Promise<Result.Result<Error, R>>;

export interface PolicyArgs<Action, Resource> {
  actor: Account;
  action: Action;
  resource: Resource;
}

/** @deprecated Use the synchronous Policy in policy.ts for new operations. */
export interface Policy<Args extends PolicyArgs<unknown, unknown>> {
  withCheck<T, R>(
    target: T,
  ): (
    args: Readonly<Args>,
    fn: PolicyAuthorizedActionFunc<T, R>,
  ) => Promise<Result.Result<Error, R>>;
}
