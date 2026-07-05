import { Promise, Result } from '@mikuroxina/mini-fn';

export const resultPromiseMonad = <E>() =>
  Promise.monadT(Result.traversableMonad<E>());
