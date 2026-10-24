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
