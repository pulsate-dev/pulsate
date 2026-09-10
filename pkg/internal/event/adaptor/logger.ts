import { Logger } from 'tslog';

export const eventModuleLogger = new Logger({
  // ToDo: Add configuration for logger
  type: 'pretty',
  name: 'EventModule',
});
