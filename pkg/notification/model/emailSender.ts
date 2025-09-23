import { Ether, type Result } from '@mikuroxina/mini-fn';

export interface EmailSender {
  send(
    to: string,
    subject: string,
    body: string,
  ): Promise<Result.Result<Error, void>>;
}

export const emailSenderSymbol = Ether.newEtherSymbol<EmailSender>();
