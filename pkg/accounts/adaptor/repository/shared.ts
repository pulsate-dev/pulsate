import { Ether } from '@mikuroxina/mini-fn';
import { isProduction } from '../../../adaptors/env.ts';
import { prismaClient } from '../../../adaptors/prisma.ts';
import { accountRepoSymbol } from '../../model/repository.ts';
import { dummyAccounts, dummyfollows } from '../../testData/testData.ts';
import { InMemoryAccountRepository } from './dummy/account.ts';
import { newFollowRepo } from './dummy/follow.ts';
import { PrismaAccountRepository, prismaFollowRepo } from './prisma/prisma.ts';

const dummyAccountsStore = new InMemoryAccountRepository(dummyAccounts);
export const dummyAccountRepository = Ether.newEther(
  accountRepoSymbol,
  () => dummyAccountsStore,
);
export const dummyFollowRepository = newFollowRepo(dummyfollows);

// Authorization readers and mutation services must observe the same current state.
const productionAccountsStore = isProduction
  ? new PrismaAccountRepository(prismaClient)
  : undefined;
export const accountRepository = productionAccountsStore
  ? Ether.newEther(accountRepoSymbol, () => productionAccountsStore)
  : dummyAccountRepository;
export const accountFollowRepository = isProduction
  ? prismaFollowRepo(prismaClient)
  : dummyFollowRepository;
