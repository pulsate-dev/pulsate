import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';

import { resultPromiseMonad } from '../../internal/monad/mod.ts';
import {
  type PasswordEncoder,
  passwordEncoderSymbol,
} from '../../internal/password/mod.ts';
import { Account, type AccountName } from '../model/account.ts';
import { AccountInternalError, AccountNotFoundError } from '../model/errors.ts';
import {
  type AccountRepository,
  accountRepoSymbol,
} from '../model/repository.ts';

export class EditService {
  #accountRepository: AccountRepository;
  #passwordEncoder: PasswordEncoder;
  constructor(
    accountRepository: AccountRepository,
    passwordEncoder: PasswordEncoder,
  ) {
    this.#accountRepository = accountRepository;
    this.#passwordEncoder = passwordEncoder;
  }

  async editNickname(
    target: AccountName,
    nickname: string,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const monad = resultPromiseMonad<Error>();

    return Cat.doT(monad)
      .addM('account', this.findAccount(target, 'account not found'))
      .addM('actor', this.findAccount(actorName, 'actor not found'))
      .when(
        ({ account, actor }) => !this.isAllowed('edit', actor, account),
        () => Promise.resolve(Result.err(new Error('not allowed'))),
      )
      .runWith(({ account }) =>
        monad.map(() => [])(Promise.resolve(account.setNickName(nickname))),
      )
      .runWith(({ account }) =>
        monad.map(() => [])(this.#accountRepository.edit(account)),
      )
      .finish(() => true);
  }

  async editPassphrase(
    target: AccountName,
    newPassphrase: string,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const monad = resultPromiseMonad<Error>();

    return Cat.doT(monad)
      .addM('account', this.findAccount(target, 'account not found'))
      .addM('actor', this.findAccount(actorName, 'actor not found'))
      .when(
        ({ account, actor }) => !this.isAllowed('edit', actor, account),
        () => Promise.resolve(Result.err(new Error('not allowed'))),
      )
      .runWith(() =>
        monad.map(() => [])(
          Promise.resolve(Account.validatePassphrase(newPassphrase)),
        ),
      )
      .addMWith('encoded', () =>
        this.#passwordEncoder
          .encodePassword(newPassphrase)
          .then(Result.ok)
          .catch((e) =>
            Result.err(
              new AccountInternalError('failed to encode passphrase', {
                cause: e,
              }),
            ),
          ),
      )
      .runWith(({ account, encoded }) =>
        monad.map(() => [])(
          Promise.resolve(account.setPassphraseHash(encoded)),
        ),
      )
      .runWith(({ account }) =>
        monad.map(() => [])(this.#accountRepository.edit(account)),
      )
      .finish(() => true);
  }

  async editEmail(
    target: AccountName,
    newEmail: string,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const monad = resultPromiseMonad<Error>();

    // TODO: add a process to check the email is active
    return Cat.doT(monad)
      .addM('account', this.findAccount(target, 'account not found'))
      .addM('actor', this.findAccount(actorName, 'actor not found'))
      .when(
        ({ account, actor }) => !this.isAllowed('edit', actor, account),
        () => Promise.resolve(Result.err(new Error('not allowed'))),
      )
      .runWith(({ account }) =>
        monad.map(() => [])(Promise.resolve(account.setMail(newEmail))),
      )
      .runWith(({ account }) =>
        monad.map(() => [])(this.#accountRepository.edit(account)),
      )
      .finish(() => true);
  }

  async editBio(
    target: AccountName,
    bio: string,
    actorName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const monad = resultPromiseMonad<Error>();

    return Cat.doT(monad)
      .addM('account', this.findAccount(target, 'account not found'))
      .addM('actor', this.findAccount(actorName, 'actor not found'))
      .when(
        ({ account, actor }) => !this.isAllowed('edit', actor, account),
        () => Promise.resolve(Result.err(new Error('not allowed'))),
      )
      .runWith(({ account }) =>
        monad.map(() => [])(Promise.resolve(account.setBio(bio))),
      )
      .runWith(({ account }) =>
        monad.map(() => [])(this.#accountRepository.edit(account)),
      )
      .finish(() => true);
  }

  private findAccount(
    name: AccountName,
    notFoundMessage: string,
  ): Promise<Result.Result<Error, Account>> {
    return this.#accountRepository
      .findByName(name)
      .then(
        Option.okOr(new AccountNotFoundError(notFoundMessage, { cause: null })),
      );
  }

  private isAllowed(
    action: 'edit',
    actor: Account,
    resource: Account,
  ): boolean {
    switch (action) {
      case 'edit':
        // NOTE: Frozen account or notActivated account can't edit account information
        if (actor.isFrozen() || !actor.isActivated()) {
          return false;
        }

        // NOTE: Account can't edit other account information
        return actor.getID() === resource.getID();
      default:
        return false;
    }
  }
}

export const editSymbol = Ether.newEtherSymbol<EditService>();
export const edit = Ether.newEther(
  editSymbol,
  ({ accountRepository, passwordEncoder }) =>
    new EditService(accountRepository, passwordEncoder),
  {
    accountRepository: accountRepoSymbol,
    passwordEncoder: passwordEncoderSymbol,
  },
);
