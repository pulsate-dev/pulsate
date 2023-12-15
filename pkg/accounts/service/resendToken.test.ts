import { InMemoryAccountRepository, InMemoryAccountVerifyTokenRepository } from '../adaptor/repository/dummy.ts';
import { ResendVerifyTokenService } from './resendToken.ts';
import {assertEquals} from "std/assert";

const repository = new InMemoryAccountRepository();
const verifyRepository = new InMemoryAccountVerifyTokenRepository();


Deno.test("resend verify token", () => {
  const service = new ResendVerifyTokenService(repository, verifyRepository);
  const actual = service.handle("test");

  assertEquals(actual, void 0);
})
