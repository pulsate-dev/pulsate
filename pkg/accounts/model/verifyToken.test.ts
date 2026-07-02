import { describe, expect, it } from 'vitest';
import type { AccountID } from './account.js';
import { VerifyToken } from './verifyToken.js';

const accountID = '1' as AccountID;
const future = new Date('2099-01-01T00:00:00Z');
const past = new Date('2000-01-01T00:00:00Z');

describe('VerifyToken', () => {
  describe('generate', () => {
    it('generates a 6-digit numeric token', () => {
      const token = VerifyToken.new(accountID, future);

      expect(token.getToken()).toMatch(/^\d{6}$/);
    });

    it('sets the given accountID and expire', () => {
      const token = VerifyToken.new(accountID, future);

      expect(token.getAccountID()).toBe(accountID);
      expect(token.getExpire()).toBe(future);
    });
  });

  describe('isExpired', () => {
    it('returns false when expire is in the future', () => {
      const token = VerifyToken.reconstruct({
        accountID,
        token: '123456',
        expire: future,
      });

      expect(token.isExpired(new Date('2024-01-01T00:00:00Z'))).toBe(false);
    });

    it('returns true when expire is in the past', () => {
      const token = VerifyToken.reconstruct({
        accountID,
        token: '123456',
        expire: past,
      });

      expect(token.isExpired(new Date('2024-01-01T00:00:00Z'))).toBe(true);
    });
  });

  describe('matches', () => {
    it('returns true when token matches', () => {
      const token = VerifyToken.reconstruct({
        accountID,
        token: '123456',
        expire: future,
      });

      expect(token.matches('123456')).toBe(true);
    });

    it('returns false when token does not match', () => {
      const token = VerifyToken.reconstruct({
        accountID,
        token: '123456',
        expire: future,
      });

      expect(token.matches('654321')).toBe(false);
    });
  });
});
