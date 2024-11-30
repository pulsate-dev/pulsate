import { Logger } from 'tslog';

export const noteModuleLogger = new Logger({
  // ToDo: Add configuration for logger
  type: 'pretty',
  name: 'NoteModule',
});
