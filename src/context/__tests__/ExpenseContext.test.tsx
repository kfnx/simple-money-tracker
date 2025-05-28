
import { renderHook, act } from '@testing-library/react';
import { ExpenseProvider, useExpenses } from '../ExpenseContext';
import { AuthProvider } from '../AuthContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <ExpenseProvider>
      {children}
    </ExpenseProvider>
  </AuthProvider>
);

describe('ExpenseContext', () => {
  test('calculates totals correctly', async () => {
    const { result } = renderHook(() => useExpenses(), { wrapper });

    await act(async () => {
      await result.current.addExpense({
        amount: 50000,
        category: 'food',
        type: 'expense',
        date: new Date(),
        note: 'Test expense'
      });
    });

    await act(async () => {
      await result.current.addExpense({
        amount: 100000,
        category: 'salary',
        type: 'income',
        date: new Date(),
        note: 'Test income'
      });
    });

    expect(result.current.totalSpent).toBe(50000);
    expect(result.current.totalIncome).toBe(100000);
    expect(result.current.balance).toBe(50000);
  });

  test('adds expense correctly', async () => {
    const { result } = renderHook(() => useExpenses(), { wrapper });

    await act(async () => {
      await result.current.addExpense({
        amount: 25000,
        category: 'transport',
        type: 'expense',
        date: new Date(),
        note: 'Test transport expense'
      });
    });

    expect(result.current.expenses).toHaveLength(1);
    expect(result.current.expenses[0].amount).toBe(25000);
    expect(result.current.expenses[0].category).toBe('transport');
  });
});
