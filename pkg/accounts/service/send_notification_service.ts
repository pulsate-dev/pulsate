import { Result } from 'npm:@mikuroxina/mini-fn';

export interface SendNotificationService {
  Send(to: string, body: string): Promise<Result.Result<Error, void>>;
}
