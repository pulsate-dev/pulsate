import { Result } from '@mikuroxina/mini-fn';

export type ReactionError = {
  code: 400 | 404; // 400: Bad Request / 404: Not Found
  error: Error;
};

export class ReactionPresenter {
  handle(error: Error): Result.Err<ReactionError> {
    switch (error.message) {
      case 'Note not found':
        return Result.err({ code: 404, error });
      case 'already reacted':
        return Result.err({ code: 400, error });
      default:
        return Result.err({ code: 400, error });
    }
  }
}
