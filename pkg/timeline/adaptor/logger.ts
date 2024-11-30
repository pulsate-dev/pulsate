import { Logger } from 'tslog';

export const timelineModuleLogger = new Logger({
  // ToDo: Add configuration for logger
  type: 'pretty',
  name: 'TimelineModule',
});
