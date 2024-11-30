import { Logger } from 'tslog';

export const federationModuleLogger = new Logger({
  // ToDo: Add configuration for logger
  type: 'pretty',
  name: 'FederationModule',
});
