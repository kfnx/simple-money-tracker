import { render, screen, fireEvent } from '@testing-library/react';
import { ExpenseProvider, useExpenses } from '../ExpenseContext';
import { AuthProvider } from '../AuthContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <ExpenseProvider>{children}</ExpenseProvider>
  </AuthProvider>
);

describe('ExpenseContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('calculates totals correctly', () => {
    const TestComponent = () => {
      const { totalSpent, totalIncome, balance, addExpense } = useExpenses();
      return (
        <div>
          <div data-testid="total-spent">{totalSpent}</div>
          <div data-testid="total-income">{totalIncome}</div>
          <div data-testid="balance">{balance}</div>
          <button onClick={() => addExpense({ amount: 50000, category: 'Food', date: new Date(), type: 'expense', note: 'Lunch' })}>
            Add Expense
          </button>
          <button onClick={() => addExpense({ amount: 100000, category: 'Salary', date: new Date(), type: 'income', note: 'Monthly salary' })}>
            Add Income
          </button>
        </div>
      );
    };

    render(<TestComponent />, { wrapper });

    expect(screen.getByTestId('total-spent')).toHaveTextContent('0');
    expect(screen.getByTestId('total-income')).toHaveTextContent('0');
    expect(screen.getByTestId('balance')).toHaveTextContent('0');

    fireEvent.click(screen.getByText('Add Expense'));
    fireEvent.click(screen.getByText('Add Income'));

    expect(screen.getByTestId('total-spent')).toHaveTextContent('50000');
    expect(screen.getByTestId('total-income')).toHaveTextContent('100000');
    expect(screen.getByTestId('balance')).toHaveTextContent('50000');
  });

  it('adds expense correctly', () => {
    const TestComponent = () => {
      const { expenses, addExpense } = useExpenses();
      return (
        <div>
          <div data-testid="expenses-count">{expenses.length}</div>
          <button onClick={() => addExpense({ amount: 50000, category: 'Food', date: new Date(), type: 'expense', note: 'Lunch' })}>
            Add Expense
          </button>
        </div>
      );
    };

    render(<TestComponent />, { wrapper });

    expect(screen.getByTestId('expenses-count')).toHaveTextContent('0');
    fireEvent.click(screen.getByText('Add Expense'));
    expect(screen.getByTestId('expenses-count')).toHaveTextContent('1');
  });
});
