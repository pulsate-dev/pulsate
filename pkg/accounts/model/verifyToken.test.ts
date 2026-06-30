import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { AccountID } from './account.js';
import { VerifyToken, VerifyTokenEmptyError } from './verifyToken.js';

const accountID = '1' as AccountID;
const future = new Date('2099-01-01T00:00:00Z');
const past = new Date('2000-01-01T00:00:00Z');

describe('VerifyToken', () => {
  describe('new', () => {
    it('returns VerifyToken when token is valid', () => {
      const result = VerifyToken.new({
        accountID,
        token: 'abc123',
        expire: future,
      });

      expect(Result.isOk(result)).toBe(true);
    });

    it('returns VerifyTokenEmptyError when token is empty', () => {
      const result = VerifyToken.new({
        accountID,
        token: '',
        expire: future,
      });

      expect(Result.isErr(result)).toBe(true);
      expect(Result.unwrapErr(result)).toBeInstanceOf(VerifyTokenEmptyError);
    });
  });

  describe('isExpired', () => {
    it('returns false when expire is in the future', () => {
      const token = Result.unwrap(
        VerifyToken.new({ accountID, token: 'abc', expire: future }),
      );

      expect(token.isExpired(new Date('2024-01-01T00:00:00Z'))).toBe(false);
    });

    it('returns true when expire is in the past', () => {
      const token = Result.unwrap(
        VerifyToken.new({ accountID, token: 'abc', expire: past }),
      );

      expect(token.isExpired(new Date('2024-01-01T00:00:00Z'))).toBe(true);
    });
  });

  describe('matches', () => {
    it('returns true when token matches', () => {
      const token = Result.unwrap(
        VerifyToken.new({ accountID, token: 'correct', expire: future }),
      );

      expect(token.matches('correct')).toBe(true);
    });

    it('returns false when token does not match', () => {
      const token = Result.unwrap(
        VerifyToken.new({ accountID, token: 'correct', expire: future }),
      );

      expect(token.matches('wrong')).toBe(false);
    });
  });
});
