import { Result } from 'npm:@mikuroxina/mini-fn';

export interface SendNotificationService {
  Send(to: string, body: string): Promise<Result.Result<Error, void>>;
}

export class DummySendNotificationService implements SendNotificationService {
  Send(_: string, __: string): Promise<Result.Result<Error, void>> {
    return Promise.resolve(Result.ok(undefined));
  }
}
