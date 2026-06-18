import { describe, it, expect, beforeAll } from 'vitest';
import { AppError } from '../../../src/utils/AppError';
import {
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
} from '../../../src/utils/password';

const STRONG = 'Tr0ub4dor&3correct-horse';
const STRONG_12 = 'Tr0ub4dor&3!';

function getThrown(fn: () => void): AppError {
  try {
    fn();
  } catch (err) {
    return err as AppError;
  }
  throw new Error('Expected function to throw but it did not');
}

describe('validatePasswordStrength', () => {
  describe('length check', () => {
    it.each([
      ['empty string', ''],
      ['1 character', 'a'],
      ['11 characters — one below the minimum', 'aB3!aB3!aB3'],
    ])('throws WEAK_PASSWORD for %s', (_, password) => {
      const err = getThrown(() => validatePasswordStrength(password));
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('WEAK_PASSWORD');
      expect(err.message).toMatch(/12/);
    });

    it('does not throw at exactly 12 characters (boundary)', () => {
      expect(() => validatePasswordStrength(STRONG_12)).not.toThrow();
    });
  });

  describe('zxcvbn strength check', () => {
    it.each([
      ['repeated characters (score 0)', 'aaaaaaaaaaaa'],
      ['common word padded to 12 characters', 'password1234'],
      ['keyboard walk', 'qwertyuiopas'],
    ])('throws WEAK_PASSWORD for %s', (_, password) => {
      const err = getThrown(() => validatePasswordStrength(password));
      expect(err).toBeInstanceOf(AppError);
      expect(err.code).toBe('WEAK_PASSWORD');
      expect(err.message).toMatch(/too weak/i);
    });

    it('does not throw for a strong password', () => {
      expect(() => validatePasswordStrength(STRONG)).not.toThrow();
    });

    it('does not throw for a strong 12-character password', () => {
      expect(() => validatePasswordStrength(STRONG_12)).not.toThrow();
    });
  });
});

describe('hashPassword', () => {
  it('produces a valid bcrypt hash string with the given rounds', async () => {
    const hash = await hashPassword(STRONG, 4);
    expect(hash).toMatch(/^\$2[ab]\$04\$/);
  });

  it('produces different hashes for the same input (random salt)', async () => {
    const [hash1, hash2] = await Promise.all([
      hashPassword(STRONG, 4),
      hashPassword(STRONG, 4),
    ]);
    expect(hash1).not.toBe(hash2);
  });
});

describe('verifyPassword', () => {
  let hash: string;

  beforeAll(async () => {
    hash = await hashPassword(STRONG, 4);
  });

  it('returns true for the correct plaintext', async () => {
    expect(await verifyPassword(STRONG, hash)).toBe(true);
  });

  it.each([
    ['incorrect plaintext', 'completely-wrong-password'],
    ['empty string', ''],
    ['correct password in uppercase', STRONG.toUpperCase()],
  ])('returns false for %s', async (_, plaintext) => {
    expect(await verifyPassword(plaintext, hash)).toBe(false);
  });

  it('returns false when checked against a different hash', async () => {
    const otherHash = await hashPassword('other-strong-passphrase-here!', 4);
    expect(await verifyPassword(STRONG, otherHash)).toBe(false);
  });
});
