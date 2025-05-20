
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Expense } from '../types/expense';
import { useToast } from '@/components/ui/use-toast';

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  totalSpent: number;
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
        const parsedExpenses = JSON.parse(savedExpenses).map((expense: any) => ({
          ...expense,
          date: new Date(expense.date)
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
    
    toast({
      title: "Expense added",
      description: `${expenseData.amount.toFixed(2)} for ${expenseData.category}`,
    });
  };

  // Calculate total spent
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <ExpenseContext.Provider value={{ expenses, addExpense, totalSpent }}>
      {children}
    </ExpenseContext.Provider>
  );
};
