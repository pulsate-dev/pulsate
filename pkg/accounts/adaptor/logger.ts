import { Logger } from 'tslog';

export const accountModuleLogger = new Logger({
  // ToDo: Add configuration for logger
  type: 'pretty',
  name: 'AccountModule',
});
