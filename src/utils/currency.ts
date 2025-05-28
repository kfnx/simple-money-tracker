
// Simple utility functions for currency formatting that can be tested
export const formatCurrency = (amount: number): string => {
  return `Rp ${amount.toLocaleString('id-ID')}`;
};

export const parseCurrencyInput = (input: string): number => {
  const cleanNum = input.replace(/[^\d.]/g, '');
  return parseFloat(cleanNum) || 0;
};
