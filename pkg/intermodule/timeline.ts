import { isProduction } from '../adaptors/env.ts';
import { prismaClient } from '../adaptors/prisma.ts';
import { valkeyClient } from '../adaptors/valkey.ts';
import { InMemoryListRepository } from '../timeline/adaptor/repository/dummy.ts';
import { InMemoryTimelineCacheRepository } from '../timeline/adaptor/repository/dummyCache.ts';
import { PrismaListRepository } from '../timeline/adaptor/repository/prisma.ts';
import { ValkeyTimelineCacheRepository } from '../timeline/adaptor/repository/valkeyCache.ts';

// NOTE: Shared TimelineCacheRepository instance to ensure it's the same instance used across modules
export const timelineCacheRepositoryInstance = isProduction
  ? new ValkeyTimelineCacheRepository(valkeyClient)
  : new InMemoryTimelineCacheRepository();

// NOTE: Shared ListRepository instance
export const listRepositoryInstance = isProduction
  ? new PrismaListRepository(prismaClient)
  : new InMemoryListRepository();
