import { Ether, type Result } from '@mikuroxina/mini-fn';
import { type EmailSender, emailSenderSymbol } from '../model/emailSender.js';

export class SendEmailNotificationService {
  constructor(private readonly emailSender: EmailSender) {}
  async handle(
    to: string,
    subject: string,
    body: string,
  ): Promise<Result.Result<Error, void>> {
    return await this.emailSender.send(to, subject, body);
  }
}

export const sendEmailNotificationSymbol =
  Ether.newEtherSymbol<SendEmailNotificationService>();
export const sendEmailNotificationService = Ether.newEther(
  sendEmailNotificationSymbol,
  ({ emailSender }) => new SendEmailNotificationService(emailSender),
  {
    emailSender: emailSenderSymbol,
  },
);
