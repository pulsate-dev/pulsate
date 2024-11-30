import { Logger } from 'tslog';

export const driveModuleLogger = new Logger({
  // ToDo: Add configuration for logger
  type: 'pretty',
  name: 'DriveModule',
});
