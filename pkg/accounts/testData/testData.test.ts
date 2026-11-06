import { describe, expect, it } from 'vitest';

import { compareID } from '../../internal/id/mod.ts';
import { generateDummyAccount, generateDummyAccounts } from './testData.ts';

describe('generateDummyAccount', () => {
  it('generates distinct accounts without arguments', () => {
    const a = generateDummyAccount();
    const b = generateDummyAccount();

    expect(a.getID()).not.toBe(b.getID());
    expect(a.getName()).not.toBe(b.getName());
    expect(a.getMail()).not.toBe(b.getMail());
  });

  it('prefers overridden fields', () => {
    const account = generateDummyAccount({ frozen: 'frozen' });

    expect(account.isFrozen()).toBe(true);
  });
});

describe('generateDummyAccounts', () => {
  it('generates accounts in ascending order of creation', () => {
    const accounts = generateDummyAccounts(3);
    const ids = accounts.map((a) => a.getID());

    expect(accounts).toHaveLength(3);
    expect([...ids].sort(compareID).reverse()).toStrictEqual(ids);
    expect(accounts[0]?.getCreatedAt().getTime()).toBeLessThan(
      accounts[1]?.getCreatedAt().getTime() ?? 0,
    );
  });

  it('applies per-index overrides', () => {
    const accounts = generateDummyAccounts(2, (i) => ({
      role: i === 0 ? 'admin' : 'normal',
    }));

    expect(accounts.map((a) => a.getRole())).toStrictEqual(['admin', 'normal']);
  });
});
