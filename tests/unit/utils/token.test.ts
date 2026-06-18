import { describe, it, expect } from 'vitest';
import { parseExpiry } from '../../../src/utils/token';

describe('parseExpiry', () => {
  it('returns the value as-is for a plain integer string', () => {
    expect(parseExpiry('3600')).toBe(3600);
  });

  it('converts seconds', () => {
    expect(parseExpiry('30s')).toBe(30);
  });

  it('converts minutes', () => {
    expect(parseExpiry('15m')).toBe(900);
  });

  it('converts hours', () => {
    expect(parseExpiry('2h')).toBe(7200);
  });

  it('converts days', () => {
    expect(parseExpiry('7d')).toBe(604800);
  });

  it('falls back to multiplier 1 for an unknown unit', () => {
    expect(parseExpiry('10x')).toBe(10);
  });
});
