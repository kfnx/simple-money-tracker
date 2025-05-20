import React, { createContext, useContext, useEffect, useState } from 'react';
import { Expense } from '../types/expense';
import { useToast } from '@/components/ui/use-toast';

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  totalSpent: number;
  totalIncome: number;
  balance: number;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { toast } = useToast();
  
  // Load expenses from localStorage on mount
  useEffect(() => {
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
      try {
        // Parse JSON and convert date strings back to Date objects
        const parsedExpenses = JSON.parse(savedExpenses).map((expense: Expense) => ({
          ...expense,
          date: new Date(expense.date),
          // Add type field with default 'expense' for backwards compatibility
          type: expense.type || 'expense'
        }));
        setExpenses(parsedExpenses);
      } catch (error) {
        console.error('Failed to parse saved expenses:', error);
      }
    }
  }, []);

  // Save expenses to localStorage whenever they change
  useEffect(() => {
    if (expenses.length > 0) {
      localStorage.setItem('expenses', JSON.stringify(expenses));
    }
  }, [expenses]);

  const addExpense = (expenseData: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: crypto.randomUUID(),
      date: new Date(),
    };
    
    setExpenses((prev) => [newExpense, ...prev]);
    
    const actionType = expenseData.type === 'income' ? 'Income' : 'Expense';
    toast({
      title: `${actionType} added`,
      description: `${expenseData.amount} for ${expenseData.category}${expenseData.note ? ` - ${expenseData.note}` : ''}`,
    });
  };

  // Calculate totals
  const totalSpent = expenses
    .filter(expense => expense.type === 'expense')
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalIncome = expenses
    .filter(expense => expense.type === 'income')
    .reduce((sum, expense) => sum + expense.amount, 0);

  const balance = totalIncome - totalSpent;

  return (
    <ExpenseContext.Provider value={{ expenses, addExpense, totalSpent, totalIncome, balance }}>
      {children}
    </ExpenseContext.Provider>
  );
};
