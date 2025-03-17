import { Option } from '@mikuroxina/mini-fn';
import type { ID } from '../../id/type.js';

export type InstanceID = ID<Instance>;
/**
 * Instance blocked by local
 */
export type InstanceBlocking = 'normal' | 'blocking';
/**
 * Instance silenced by local
 */
export type InstanceSilenced = 'normal' | 'silenced';
/**
 * Instance deliver state
 */
export type InstanceDelivering = 'normal' | 'stopped';

export interface CreateInstanceArgs {
  id: InstanceID;
  name: string;
  description: string;
  fqdn: URL;
  softwareName: string;
  softwareVersion: string;
  adminName: string;
  adminContact: string;
  isLocal: boolean;
  firstContact: Date;
  extentions: string[];
  // private
  blocking: InstanceBlocking;
  silenced: InstanceSilenced;
  delivering: InstanceDelivering;
  updated: Option.Option<Date>;
}

export class Instance {
  /**
   * Instance ID
   * @type {@link InstanceID}
   * @example "30840483483726295"
   */
  private readonly id: InstanceID;
  /**
   * Instance name
   * @example "Pulsate social"
   */
  private name: string;
  /**
   * Instance description
   * @example
   * ```
   * Pulsate official instance
   * ```
   */
  private description: string;
  /**
   * Instance FQDN(Fully Qualified Domain Name)
   * @example "pulsate.social"
   */
  private readonly fqdn: string;
  /**
   * Software name
   * @example "Pulsate"
   */
  private readonly softwareName: string;
  /**
   * Software version
   * @example "1.0.0"
   */
  private softwareVersion: string;
  /**
   * Instance software extentions list
   * @example
   * ```
   * ["quote", "emoji_reaction"]
   * ```
   */
  private extentions: string[];

  /**
   * Instance admin name
   * @example "Pulsate project"
   */
  private adminName: string;
  /**
   * Instance admin contact
   * @example "admin@pulsate.dev"
   * @example "https://pulsate.dev/contact"
   */
  private adminContact: string;
  /**
   * Instance state
   * - `normal` - Instance is active
   * - `blocked` - Instance is blocked(reject all activity)
   */
  private state: InstanceBlocking;
  /**
   * Instance silenced state
   * - `normal` - Instance is not silenced
   * - `silenced` - Instance is silenced (all PUBLIC notes visibility sets to HOME)
   */
  private silenced: InstanceSilenced;
  /**
   * Instance deliver state
   * - `normal` - Instance is delivering notes
   * - `stopped` - Instance is not delivering notes
   */
  private deliverState: InstanceDelivering;
  /**
   * Instance isLocal flag
   * - `true` - Instance is local
   * - `false` - Instance is remote
   */
  private readonly isLocal: boolean;

  /**
   * Instance first contact date
   */
  private readonly firstContact: Date;

  /**
   * Instance ID
   * @returns Instance ID
   */
  getID(): InstanceID {
    return this.id;
  }

  /**
   * Instance Name
   * @returns Instance name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Set instance name
   * @param name Instance name
   */
  setName(name: string) {
    this.name = name;
  }

  /**
   * Instance description
   * @returns Instance description
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * Set instance description
   * @param description Instance description
   */
  setDescription(description: string) {
    this.description = description;
  }

  /**
   * Instance FQDN(Fully Qualified Domain Name)
   * @returns Instance FQDN
   * @example "social.example.com"
   * @example "social.example.com:3000"
   */
  getFQDN(): string {
    return this.fqdn;
  }

  /**
   * Software name
   * @returns Software name
   */
  getSoftwareName(): string {
    return this.softwareName;
  }

  /**
   * Software version
   * @returns Software version
   */
  getSoftwareVersion(): string {
    return this.softwareVersion;
  }

  /**
   * Set instance software version
   * @param version Software version
   */
  setSoftwareVersion(version: string) {
    this.softwareVersion = version;
  }

  /**
   * Instance software extentions list
   * @returns Instance software extentions list
   */
  getExtentions(): string[] {
    return this.extentions;
  }

  /**
   * Set instance software extentions list
   * @param extentions Software extentions list
   */
  setExtentions(extentions: string[]) {
    this.extentions = extentions;
  }

  /**
   * Instance admin name
   * @returns Instance admin name
   */
  getAdminName(): string {
    return this.adminName;
  }

  /**
   * Set instance admin name
   * @param name Admin name
   */
  setAdminName(name: string) {
    this.adminName = name;
  }

  /**
   * Instance admin contact
   * @returns Instance admin contact
   */
  getAdminContact(): string {
    return this.adminContact;
  }

  /**
   * Set instance admin contact
   * @param contact Admin contact
   */
  setAdminContact(contact: string) {
    this.adminContact = contact;
  }

  isBlocking(): boolean {
    return this.state === 'blocking';
  }

  /**
   * Set instance state
   */
  setInstanceState(state: InstanceBlocking) {
    this.state = state;
  }

  isSilenced(): boolean {
    return this.silenced === 'silenced';
  }

  /**
   * Set instance silenced state
   */
  setSilencedState(silenced: InstanceSilenced) {
    this.silenced = silenced;
  }

  isDeliverStopped(): boolean {
    return this.deliverState === 'stopped';
  }

  /**
   * Set instance deliver state
   */
  setDeliverState(state: InstanceDelivering) {
    this.deliverState = state;
  }

  isLocalInstance(): boolean {
    return this.isLocal;
  }

  /**
   * Instance first contact date
   * @returns Instance first contact date
   */
  getFirstContact(): Date {
    return this.firstContact;
  }

  private constructor(arg: CreateInstanceArgs) {
    this.id = arg.id;
    this.name = arg.name;
    this.description = arg.description;
    this.fqdn = arg.fqdn.host;
    this.softwareName = arg.softwareName;
    this.softwareVersion = arg.softwareVersion;
    this.extentions = arg.extentions;
    this.adminName = arg.adminName;
    this.adminContact = arg.adminContact;
    this.isLocal = arg.isLocal;
    this.firstContact = arg.firstContact;
    this.state = arg.blocking;
    this.silenced = arg.silenced;
    this.deliverState = arg.delivering;
  }

  public static new(
    arg: Omit<
      CreateInstanceArgs,
      'blocking' | 'silenced' | 'delivering' | 'updated'
    >,
  ): Instance {
    if (arg.softwareName === '') arg.softwareName = 'Unknown';
    if (arg.softwareVersion === '') arg.softwareVersion = 'Unknown';

    return new Instance({
      ...arg,
      blocking: 'normal',
      silenced: 'normal',
      delivering: 'normal',
      updated: Option.none(),
    });
  }
}
