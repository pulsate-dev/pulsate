import { AccountRepository, AccountVerifyTokenRepository } from '../model/repository.ts';

export class ResendVerifyTokenService {
private readonly accountRepository: AccountRepository;
private readonly verifyTokenRepository: AccountVerifyTokenRepository;

  constructor(accountRepository: AccountRepository, verifyTokenRepository: AccountVerifyTokenRepository) {
    this.accountRepository = accountRepository;
    this.verifyTokenRepository = verifyTokenRepository;
  }

  async handle(name: string) {
    throw new Error('Not implemented');
  }
}
