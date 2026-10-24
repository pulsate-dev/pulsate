import type { Result } from '@mikuroxina/mini-fn';

/** Modules expose predefined instances through private-constructor subclasses. */
export class PolicyAction<PolicyName extends string> {
  readonly #policyName: PolicyName;
  readonly #modelName: string;
  readonly #actionName: string;

  protected constructor(
    policyName: PolicyName,
    modelName: string,
    actionName: string,
  ) {
    this.#policyName = policyName;
    this.#modelName = modelName;
    this.#actionName = actionName;
  }

  equals(other: PolicyAction<PolicyName>): boolean {
    return (
      this.#policyName === other.#policyName &&
      this.#modelName === other.#modelName &&
      this.#actionName === other.#actionName
    );
  }

  toString(): string {
    return `${this.#policyName}.${this.#modelName}:${this.#actionName}`;
  }
}

/**
 * A synchronous authorization decision without I/O or callback execution.
 * Authorized is void for ordinary checks, or a module-owned read scope.
 * Context is an object with extra information for the check. Pass {} if none is needed.
 */
export interface Policy<
  Actor,
  Action,
  Resource,
  Authorized = void,
  PolicyError extends Error = Error,
  Context extends Record<string, unknown> = Record<string, never>,
> {
  readonly authorize: (
    actor: Actor,
    action: Action,
    resource: Resource,
    context: Context,
  ) => Result.Result<PolicyError, Authorized>;
}
