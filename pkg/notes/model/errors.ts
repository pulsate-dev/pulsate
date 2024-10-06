export class NoteNotFoundError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'NoteNotFoundError';
    this.cause = options.cause;
  }
}

export class NoteInternalError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'NoteInternalError';
    this.cause = options.cause;
  }
}

export class NoteTooManyAttachmentsError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'NoteTooManyAttachmentsError';
    this.cause = options.cause;
  }
}

export class NoteTooLongContentsError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'NoteTooLongContentsError';
    this.cause = options.cause;
  }
}

export class NoteNoDestinationError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'NoteNoDestinationError';
    this.cause = options.cause;
  }
}

export class NoteVisibilityInvalidError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'NoteVisibilityInvalidError';
    this.cause = options.cause;
  }
}

export class NoteAccountSilencedError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'NoteAccountSilencedError';
    this.cause = options.cause;
  }
}

export class NoteReplyRejectedError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'NoteReplyRejectedError';
    this.cause = options.cause;
  }
}

export class NoteInsufficientPermissionError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'NoteInsufficientPermissionError';
    this.cause = options.cause;
  }
}

export class NoteAlreadyReactedError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'NoteAlreadyReactedError';
    this.cause = options.cause;
  }
}

export class NoteEmojiNotFoundError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'EmojiNotFoundError';
    this.cause = options.cause;
  }
}

export class NoteNotReactedYetError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'NoteNotReactedYetError';
    this.cause = options.cause;
  }
}

export class AttachmentNotFoundError extends Error {
  constructor(message: string, options: { cause: unknown }) {
    super(message);
    this.name = 'AttachmentsNotFoundError';
    this.cause = options.cause;
  }
}
