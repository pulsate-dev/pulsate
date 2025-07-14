import { Result } from "@mikuroxina/mini-fn";
import { Account, type AccountName, type CreateAccountArgs } from "../../../pkg/accounts/model/account.js";
import { MockClock, SnowflakeIDGenerator } from "../../../pkg/id/mod.js";
import { faker } from "./dummyInput.js";

const idGenerator = (date: Date) => new SnowflakeIDGenerator(0, new MockClock(date));

export function createAccount(args: Partial<CreateAccountArgs>): Account {
  const createdAt = args.createdAt ?? faker.date.future({ refDate: new Date("2023-09-10T00:00:00Z") });

  return Account.reconstruct({
    id: args.id ?? Result.unwrap(idGenerator(createdAt).generate<Account>()),
    name: args.name ?? `${faker.internet.username()}@${faker.internet.domainName()}` as AccountName,
    mail: args.mail ?? faker.internet.email(),
    nickname: args.nickname ?? faker.internet.displayName(),
    bio: faker.person.bio(),
    role: args.role ?? "admin",
    frozen: args.frozen ?? "normal",
    silenced: args.silenced ?? "normal",
    status: args.status ?? "active",
    createdAt: faker.date.future({refDate: new Date("2023-09-10T00:00:00Z")}),
  })
}

