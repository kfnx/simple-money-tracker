
import { render, screen } from '@testing-library/react';
import { SummaryCard } from '../SummaryCard';
import { ExpenseProvider } from '@/context/ExpenseContext';

const MockExpenseProvider = ({ children, mockValues }: any) => {
  const defaultMockValues = {
    totalSpent: 0,
    totalIncome: 0,
    balance: 0,
    expenses: [],
    addExpense: jest.fn(),
    updateExpense: jest.fn(),
    deleteExpense: jest.fn(),
    clearData: jest.fn(),
    ...mockValues
  };

  return (
    <ExpenseProvider value={defaultMockValues}>
      {children}
    </ExpenseProvider>
  );
};

describe('SummaryCard', () => {
  test('renders balance correctly', () => {
    const mockValues = {
      totalSpent: 50000,
      totalIncome: 100000,
      balance: 50000
    };

    render(
      <MockExpenseProvider mockValues={mockValues}>
        <SummaryCard />
      </MockExpenseProvider>
    );

    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByText('Rp 50,000')).toBeInTheDocument();
  });

  test('shows income and expenses', () => {
    const mockValues = {
      totalSpent: 25000,
      totalIncome: 75000,
      balance: 50000
    };

    render(
      <MockExpenseProvider mockValues={mockValues}>
        <SummaryCard />
      </MockExpenseProvider>
    );

    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Rp 75,000')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('Rp 25,000')).toBeInTheDocument();
  });
});
