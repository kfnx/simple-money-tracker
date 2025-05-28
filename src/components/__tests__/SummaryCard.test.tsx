import { render, screen } from '@testing-library/react';
import { SummaryCard } from '../SummaryCard';
import { useExpenses } from '@/context/ExpenseContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/context/ExpenseContext', () => ({
  useExpenses: vi.fn()
}));

describe('SummaryCard', () => {
  beforeEach(() => {
    vi.mocked(useExpenses).mockReturnValue({
      totalSpent: 50000,
      totalIncome: 100000,
      balance: 50000,
      expenses: [],
      addExpense: vi.fn(),
      deleteExpense: vi.fn(),
      updateExpense: vi.fn(),
      clearData: vi.fn()
    });
  });

  it('renders summary information correctly', () => {
    render(<SummaryCard />);
    
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();

    const balanceElement = screen.getByText('Balance').closest('div')?.querySelector('p');
    const incomeElement = screen.getByText('Income').closest('div')?.querySelector('p');
    const expensesElement = screen.getByText('Expenses').closest('div')?.querySelector('p');

    expect(balanceElement).toHaveTextContent('Rp 50.000');
    expect(incomeElement).toHaveTextContent('Rp 100.000');
    expect(expensesElement).toHaveTextContent('Rp 50.000');
  });
});
