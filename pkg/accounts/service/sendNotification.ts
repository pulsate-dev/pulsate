import { Ether, Result } from '@mikuroxina/mini-fn';

export interface SendNotificationService {
  send(to: string, body: string): Promise<Result.Result<Error, void>>;
}
export const sendNotificationSymbol =
  Ether.newEtherSymbol<SendNotificationService>();

export class DummySendNotificationService implements SendNotificationService {
  send(): Promise<Result.Result<Error, void>> {
    return Promise.resolve(Result.ok(undefined));
  }
}
export const dummy = Ether.newEther(
  sendNotificationSymbol,
  () => new DummySendNotificationService(),
);
