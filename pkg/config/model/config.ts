export type AccountName = `@${string}@${string}`;

export interface CreateConfigArgs {
  instanceName: string;
  instanceFqdn: string;
  openRegistration: boolean;
  maintainerAccount: AccountName;
  maintainerEmail: string;
}

export class Config {
  private constructor(arg: CreateConfigArgs) {
    this.instanceName = arg.instanceName;
    this.instanceFqdn = arg.instanceFqdn;
    this.openRegistration = arg.openRegistration;
    this.maintainerAccount = arg.maintainerAccount;
    this.maintainerEmail = arg.maintainerEmail;
  }

  private readonly instanceName: string;
  getInstanceName(): string {
    return this.instanceName;
  }

  private readonly instanceFqdn: string;
  getInstanceFqdn(): string {
    return this.instanceFqdn;
  }

  private readonly openRegistration: boolean;
  isOpenRegistration(): boolean {
    return this.openRegistration;
  }

  private readonly maintainerAccount: AccountName;
  getMaintainerAccount(): AccountName {
    return this.maintainerAccount;
  }

  private readonly maintainerEmail: string;
  getMaintainerEmail(): string {
    return this.maintainerEmail;
  }

  public static new(arg: CreateConfigArgs): Config {
    return new Config(arg);
  }
}
