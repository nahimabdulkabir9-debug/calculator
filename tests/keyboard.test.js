import { describe, expect, it } from 'vitest';
import { resolveKey } from '../src/keyboard.js';

describe('resolveKey', () => {
  it('maps digits', () => {
    expect(resolveKey('7')).toEqual({ action: 'digit', value: '7' });
  });

  it('maps decimal keys', () => {
    expect(resolveKey('.')).toEqual({ action: 'decimal' });
    expect(resolveKey(',')).toEqual({ action: 'decimal' });
  });

  it('maps operators', () => {
    expect(resolveKey('+')).toEqual({ action: 'operator', value: '+' });
    expect(resolveKey('-')).toEqual({ action: 'operator', value: '-' });
    expect(resolveKey('*')).toEqual({ action: 'operator', value: '*' });
    expect(resolveKey('x')).toEqual({ action: 'operator', value: '*' });
    expect(resolveKey('/')).toEqual({ action: 'operator', value: '/' });
  });

  it('maps command keys', () => {
    expect(resolveKey('Enter')).toEqual({ action: 'equals' });
    expect(resolveKey('=')).toEqual({ action: 'equals' });
    expect(resolveKey('Escape')).toEqual({ action: 'clear-all' });
    expect(resolveKey('Delete')).toEqual({ action: 'clear-entry' });
    expect(resolveKey('Backspace')).toEqual({ action: 'backspace' });
    expect(resolveKey('%')).toEqual({ action: 'percent' });
  });

  it('maps shortcut letters', () => {
    expect(resolveKey('r')).toEqual({ action: 'unary', value: 'sqrt' });
    expect(resolveKey('s')).toEqual({ action: 'unary', value: 'square' });
    expect(resolveKey('i')).toEqual({ action: 'unary', value: 'reciprocal' });
    expect(resolveKey('m')).toEqual({ action: 'memory', value: 'recall' });
  });

  it('ignores unknown or empty keys', () => {
    expect(resolveKey('F5')).toBeNull();
    expect(resolveKey('')).toBeNull();
    expect(resolveKey(undefined)).toBeNull();
  });
});
