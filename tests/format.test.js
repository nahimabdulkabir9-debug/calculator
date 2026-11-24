import { describe, expect, it } from 'vitest';
import {
  formatDisplay,
  normalizeNumber,
  numberToEntry,
} from '../src/format.js';

describe('normalizeNumber', () => {
  it('rounds floating point noise away', () => {
    expect(normalizeNumber(0.1 + 0.2)).toBe(0.3);
  });

  it('keeps twelve significant digits', () => {
    expect(normalizeNumber(1 / 3)).toBe(0.333333333333);
  });

  it('normalizes negative zero', () => {
    expect(Object.is(normalizeNumber(-0), 0)).toBe(true);
  });

  it('rejects non-finite numbers', () => {
    expect(normalizeNumber(Number.POSITIVE_INFINITY)).toBeNull();
    expect(normalizeNumber(Number.NaN)).toBeNull();
    expect(normalizeNumber('5')).toBeNull();
  });
});

describe('numberToEntry', () => {
  it('stringifies numbers', () => {
    expect(numberToEntry(5)).toBe('5');
    expect(numberToEntry(-2.5)).toBe('-2.5');
  });

  it('falls back to zero for invalid input', () => {
    expect(numberToEntry(Number.NaN)).toBe('0');
  });

  it('uses exponent notation for huge values', () => {
    expect(numberToEntry(1e21)).toBe('1e+21');
  });
});

describe('formatDisplay', () => {
  it('groups thousands', () => {
    expect(formatDisplay('1234567')).toBe('1,234,567');
  });

  it('groups the integer part only', () => {
    expect(formatDisplay('1234.5678')).toBe('1,234.5678');
  });

  it('keeps a trailing decimal point while typing', () => {
    expect(formatDisplay('0.')).toBe('0.');
    expect(formatDisplay('-12.')).toBe('-12.');
  });

  it('formats negative numbers', () => {
    expect(formatDisplay('-1234.5')).toBe('-1,234.5');
  });

  it('passes exponent notation through', () => {
    expect(formatDisplay('1e+21')).toBe('1e+21');
  });

  it('accepts numbers as well as strings', () => {
    expect(formatDisplay(1234)).toBe('1,234');
  });

  it('defaults missing values to zero', () => {
    expect(formatDisplay(undefined)).toBe('0');
    expect(formatDisplay(null)).toBe('0');
    expect(formatDisplay('')).toBe('0');
    expect(formatDisplay('.')).toBe('0');
  });
});
