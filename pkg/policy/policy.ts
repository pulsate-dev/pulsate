import type { Result } from '@mikuroxina/mini-fn';
import type { Account } from '../accounts/model/account.js';

export type PolicyAuthorizedActionFunc<T, R> = (
  target: T,
) => Promise<Result.Result<Error, R>>;

export interface PolicyArgs<Action, Resource> {
  actor: Account;
  action: Action;
  resource: Resource;
}

export interface Policy<Args extends PolicyArgs<unknown, unknown>> {
  withCheck<T, R>(
    target: T,
  ): (
    args: Args,
    fn: PolicyAuthorizedActionFunc<T, R>,
  ) => Promise<Result.Result<Error, R>>;
}
