import { expectTypeOf, it } from 'vitest';
import type { PolicyAction } from './policy.ts';

it('rejects actions from other policies', () => {
  expectTypeOf<PolicyAction<'Accounts'>>().not.toExtend<
    PolicyAction<'Notes'>
  >();
  expectTypeOf<PolicyAction<'Notes'>>().not.toExtend<
    PolicyAction<'Accounts'>
  >();
});

it('preserves the policy name in the string representation', () => {
  expectTypeOf<
    ReturnType<PolicyAction<'Notes'>['toString']>
  >().toEqualTypeOf<`Notes.${string}:${string}`>();
  expectTypeOf<
    ReturnType<PolicyAction<'Notes'>['toString']>
  >().not.toExtend<`Accounts.${string}:${string}`>();
});
