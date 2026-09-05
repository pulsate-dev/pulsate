import { type Option, Result } from '@mikuroxina/mini-fn';
import * as v from 'valibot';
import {
  type AccountAlreadyDeletedError,
  type AccountAlreadyFrozenError,
  AccountMailAddressLengthError,
} from './account.errors.ts';
import {
  Account,
  type AccountID,
  type AccountName,
  type AccountRole,
  mailSchema,
} from './account.ts';
import {
  type AccountRegisteredEvent,
  accountEventFactory,
} from './event/accountEvents.ts';

export interface CreateInactiveAccountArgs {
  id: AccountID;
  name: AccountName;
  mail: string;
  passphraseHash: string;
  role: AccountRole;
}

export interface ActivateArgs {
  createdAt: Date;
}

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
    this.#passphraseHash = arg.passphraseHash;
    this.#role = arg.role;
    this.#activated = false;
  }

  #activated: boolean;
  isActivated(): boolean {
    return this.#activated;
  }

  #events: AccountRegisteredEvent[] = [];
  pullEvents(): AccountRegisteredEvent[] {
    return this.#events.splice(0);
  }

  readonly #id: AccountID;
  getID(): AccountID {
    return this.#id;
  }

  readonly #name: AccountName;
  getName(): AccountName {
    return this.#name;
  }

  readonly #mail: string;
  getMail(): string {
    return this.#mail;
  }

  readonly #passphraseHash: string;
  getPassphraseHash(): string {
    return this.#passphraseHash;
  }

  readonly #role: AccountRole;
  getRole(): AccountRole {
    return this.#role;
  }

  activate(
    args: ActivateArgs,
    actor: Option.Option<AccountID>,
  ): Result.Result<
    | AccountAlreadyActivatedError
    | AccountAlreadyDeletedError
    | AccountAlreadyFrozenError,
    Account
  > {
    if (this.isActivated()) {
      return Result.err(
        new AccountAlreadyActivatedError('This account was already activated.'),
      );
    }

    const account = Account.reconstruct({
      id: this.#id,
      name: this.#name,
      mail: this.#mail,
      passphraseHash: this.#passphraseHash,
      role: this.#role,
      nickname: '',
      bio: '',
      createdAt: args.createdAt,
      status: 'notActivated',
      frozen: 'normal',
      silenced: 'normal',
      updatedAt: undefined,
      deletedAt: undefined,
    });
    const activated = account.activate(actor);
    if (Result.isErr(activated)) {
      return activated;
    }

    this.#activated = true;
    return Result.ok(account);
  }

  static new(
    arg: CreateInactiveAccountArgs,
    actor: Option.Option<AccountID>,
  ): Result.Result<AccountMailAddressLengthError, InactiveAccount> {
    if (!v.safeParse(mailSchema, arg.mail).success) {
      return Result.err(
        new AccountMailAddressLengthError(
          'mail address length is out of range',
        ),
      );
    }

    const account = new InactiveAccount(arg);
    account.#events.push(
      accountEventFactory.registered({ target: arg.id, actor, mail: arg.mail }),
    );
    return Result.ok(account);
  }

  static reconstruct(arg: CreateInactiveAccountArgs): InactiveAccount {
    return new InactiveAccount(arg);
  }
}
