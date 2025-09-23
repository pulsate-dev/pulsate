import { Result } from '@mikuroxina/mini-fn';
import { createMessage } from '@upyo/core';
import { SmtpTransport } from '@upyo/smtp';
import type { EmailSender } from '../../model/emailSender.js';

export class SMTPEmailSender implements EmailSender {
  constructor(
    private readonly smtpHost: string,
    private readonly smtpPort: number,
    private readonly smtpUser: string,
    private readonly smtpPass: string,
  ) {}

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
      host: this.smtpHost,
      port: this.smtpPort,
      secure: true,
      auth: {
        user: this.smtpUser,
        pass: this.smtpPass,
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
