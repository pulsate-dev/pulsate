import { describe, expect, it } from 'vitest';
import { PolicyAction } from './policy.ts';

class TestAction extends PolicyAction<string> {
  constructor(policyName: string, modelName: string, actionName: string) {
    super(policyName, modelName, actionName);
  }
}

describe('PolicyAction', () => {
  it('considers separate instances with the same values equal', () => {
    const action = new TestAction('Notes', 'Note', 'read');
    const sameAction = new TestAction('Notes', 'Note', 'read');

    expect(action).not.toBe(sameAction);
    expect(action.equals(sameAction)).toBe(true);
  });

  it.each([
    ['Accounts', 'Note', 'read'],
    ['Notes', 'Attachment', 'read'],
    ['Notes', 'Note', 'write'],
  ])(
    'considers actions unequal when a value differs: %s.%s:%s',
    (policyName, modelName, actionName) => {
      const action = new TestAction('Notes', 'Note', 'read');

      expect(
        action.equals(new TestAction(policyName, modelName, actionName)),
      ).toBe(false);
    },
  );

  it('returns the canonical action identifier from toString', () => {
    const action = new TestAction('Notes', 'Note', 'read');

    expect(action.toString()).toBe('Notes.Note:read');
  });
});
