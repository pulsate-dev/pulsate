export class ConfigInvalidError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'ConfigInvalidError';
    this.cause = options.cause;
  }
}
