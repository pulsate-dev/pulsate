import { Result } from '@mikuroxina/mini-fn';
import * as v from 'valibot';
import { AccountMailAddressLengthError } from './account.errors.js';
import {
  Account,
  type AccountID,
  type AccountName,
  type CreateAccountArgs,
  mailSchema,
} from './account.js';

export interface CreateInactiveAccountArgs {
  id: AccountID;
  name: AccountName;
  mail: string;
}

export type ActivateArgs = Omit<
  CreateAccountArgs,
  keyof Omit<CreateInactiveAccountArgs, 'activated'>
>;

export class AccountAlreadyActivatedError extends Error {
  override readonly name = 'AccountAlreadyActivatedError' as const;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.cause = options?.cause;
  }
}

export class InactiveAccount {
  private constructor(arg: CreateInactiveAccountArgs) {
    this.#id = arg.id;
    this.#name = arg.name;
    this.#mail = arg.mail;
    this.#activated = false;
  }

  #activated: boolean;
  isActivated(): boolean {
    return this.#activated;
  }

  readonly #id: AccountID;
  getID(): string {
    return this.#id;
  }

  readonly #name: AccountName;
  getName(): string {
    return this.#name;
  }

  readonly #mail: string;
  getMail(): string {
    return this.#mail;
  }

  activate(
    args: ActivateArgs,
  ): Result.Result<AccountAlreadyActivatedError, Account> {
    if (this.isActivated()) {
      return Result.err(
        new AccountAlreadyActivatedError('This account was already activated.'),
      );
    }

    this.#activated = true;
    return Result.ok(
      Account.reconstruct({
        id: this.#id,
        name: this.#name,
        mail: this.#mail,
        ...args,
        status: 'active',
        updatedAt: undefined,
        deletedAt: undefined,
      }),
    );
  }

  static new(
    arg: CreateInactiveAccountArgs,
  ): Result.Result<AccountMailAddressLengthError, InactiveAccount> {
    if (!v.safeParse(mailSchema, arg.mail).success) {
      return Result.err(
        new AccountMailAddressLengthError(
          'mail address length is out of range',
        ),
      );
    }
    return Result.ok(new InactiveAccount(arg));
  }

  static reconstruct(arg: CreateInactiveAccountArgs): InactiveAccount {
    return new InactiveAccount(arg);
  }
}
