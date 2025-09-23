import { Ether, Result } from '@mikuroxina/mini-fn';
import { createMessage } from '@upyo/core';
import { SmtpTransport } from '@upyo/smtp';
import {
  type EmailSender,
  emailSenderSymbol,
} from '../../model/emailSender.js';

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export class SmtpEmailSender implements EmailSender {
  constructor(private readonly smtpConfig: SmtpConfig) {}

  async send(
    to: string,
    subject: string,
    body: string,
  ): Promise<Result.Result<Error, void>> {
    const message = createMessage({
      // ToDo: make configurable
      from: 'system@example.com',
      to: to,
      subject: subject,
      content: {
        text: body,
      },
    });

    const res = await new SmtpTransport({
      host: this.smtpConfig.host,
      port: this.smtpConfig.port,
      secure: true,
      auth: {
        user: this.smtpConfig.user,
        pass: this.smtpConfig.pass,
      },
    }).send(message);

    if (!res.successful) {
      return Result.err(
        new Error('Failed to send email', { cause: res.errorMessages }),
      );
    }

    return Result.ok(undefined);
  }
}

export const smtpEmailSender = (config: SmtpConfig) =>
  Ether.newEther(emailSenderSymbol, () => new SmtpEmailSender(config));
