
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { SummaryCard } from '../SummaryCard';
import * as ExpenseContext from '@/context/ExpenseContext';

// Mock the useExpenses hook
const mockUseExpenses = jest.fn();

beforeEach(() => {
  jest.spyOn(ExpenseContext, 'useExpenses').mockImplementation(mockUseExpenses);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('SummaryCard', () => {
  test('renders balance correctly', () => {
    mockUseExpenses.mockReturnValue({
      totalSpent: 50000,
      totalIncome: 100000,
      balance: 50000,
      expenses: [],
      addExpense: jest.fn(),
      updateExpense: jest.fn(),
      deleteExpense: jest.fn(),
      clearData: jest.fn(),
    });

    render(<SummaryCard />);

    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByText('Rp 50,000')).toBeInTheDocument();
  });

  test('shows income and expenses', () => {
    mockUseExpenses.mockReturnValue({
      totalSpent: 25000,
      totalIncome: 75000,
      balance: 50000,
      expenses: [],
      addExpense: jest.fn(),
      updateExpense: jest.fn(),
      deleteExpense: jest.fn(),
      clearData: jest.fn(),
    });

    render(<SummaryCard />);

    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Rp 75,000')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('Rp 25,000')).toBeInTheDocument();
  });
});
