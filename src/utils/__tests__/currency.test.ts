
import { formatCurrency, parseCurrencyInput } from '../currency';

describe('Currency Utils', () => {
  test('formatCurrency formats numbers correctly', () => {
    expect(formatCurrency(50000)).toBe('Rp 50,000');
    expect(formatCurrency(1234567)).toBe('Rp 1,234,567');
    expect(formatCurrency(0)).toBe('Rp 0');
  });

  test('parseCurrencyInput parses input correctly', () => {
    expect(parseCurrencyInput('50.000')).toBe(50000);
    expect(parseCurrencyInput('Rp 123,456')).toBe(123456);
    expect(parseCurrencyInput('')).toBe(0);
    expect(parseCurrencyInput('abc')).toBe(0);
  });
});
