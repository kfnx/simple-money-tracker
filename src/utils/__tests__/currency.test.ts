import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrencyInput } from '../currency';

describe('Currency Utils', () => {
  it('formatCurrency formats numbers correctly', () => {
    expect(formatCurrency(50000)).toBe('Rp 50.000');
    expect(formatCurrency(123456)).toBe('Rp 123.456');
    expect(formatCurrency(0)).toBe('Rp 0');
  });

  it('parseCurrencyInput parses input correctly', () => {
    expect(parseCurrencyInput('50.000')).toBe(50);
    expect(parseCurrencyInput('Rp 123.456')).toBe(123.456);
    expect(parseCurrencyInput('')).toBe(0);
  });
});
