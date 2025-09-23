import { Ether, Result } from '@mikuroxina/mini-fn';
import {
  type EmailSender,
  emailSenderSymbol,
} from '../../model/emailSender.js';

export class DummyEmailSender implements EmailSender {
  async send(
    to: string,
    subject: string,
    body: string,
  ): Promise<Result.Result<Error, void>> {
    console.log(
      `DummyEmailSender: Sending email to ${to}\nSubject: ${subject}\nBody: ${body}`,
    );
    return Result.ok(undefined);
  }
}
export const dummyEmailSender = Ether.newEther(
  emailSenderSymbol,
  () => new DummyEmailSender(),
);
