
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Expense, DatabaseExpense } from '@/types/expense';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  updateExpense: (id: string, expense: Partial<Omit<Expense, 'id'>>) => void;
  deleteExpense: (id: string) => void;
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
  const { user } = useAuth();
  
  // Load expenses from Supabase when user is logged in
  useEffect(() => {
    const fetchExpenses = async () => {
      if (!user) {
        // If no user, load from localStorage
        const savedExpenses = localStorage.getItem('expenses');
        if (savedExpenses) {
          try {
            // Parse JSON and convert date strings back to Date objects
            const parsedExpenses = JSON.parse(savedExpenses).map((expense: any) => ({
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
        return;
      }
      
      try {
        // Fetch expenses from Supabase
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .order('date', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        // Convert database expenses to frontend expenses
        const convertedExpenses: Expense[] = (data as DatabaseExpense[]).map(dbExpense => ({
          id: dbExpense.id,
          amount: Number(dbExpense.amount),
          category: dbExpense.category as any,
          date: new Date(dbExpense.date),
          type: dbExpense.type as 'expense' | 'income',
          note: dbExpense.note
        }));
        
        setExpenses(convertedExpenses);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        toast({
          title: 'Error loading expenses',
          description: 'Failed to load your expenses.',
          variant: 'destructive',
        });
      }
    };

    fetchExpenses();
  }, [user, toast]);

  // Save expenses to localStorage when not logged in
  useEffect(() => {
    if (!user && expenses.length > 0) {
      localStorage.setItem('expenses', JSON.stringify(expenses));
    }
  }, [expenses, user]);

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: crypto.randomUUID(),
      date: new Date(),
    };
    
    if (user) {
      try {
        // Add expense to Supabase
        const { error } = await supabase.from('expenses').insert({
          amount: newExpense.amount,
          category: newExpense.category,
          type: newExpense.type,
          note: newExpense.note,
          user_id: user.id,
        });
        
        if (error) {
          throw error;
        }
        
        // Refresh expenses from database
        const { data, error: fetchError } = await supabase
          .from('expenses')
          .select('*')
          .order('date', { ascending: false });
          
        if (fetchError) {
          throw fetchError;
        }
        
        // Convert database expenses to frontend expenses
        const convertedExpenses: Expense[] = (data as DatabaseExpense[]).map(dbExpense => ({
          id: dbExpense.id,
          amount: Number(dbExpense.amount),
          category: dbExpense.category as any,
          date: new Date(dbExpense.date),
          type: dbExpense.type as 'expense' | 'income',
          note: dbExpense.note
        }));
        
        setExpenses(convertedExpenses);
      } catch (error) {
        console.error('Error adding expense:', error);
        toast({
          title: 'Error adding expense',
          description: 'Failed to save your expense.',
          variant: 'destructive',
        });
        return;
      }
    } else {
      // Add to local state if not logged in
      setExpenses((prev) => [newExpense, ...prev]);
    }
    
    const actionType = expenseData.type === 'income' ? 'Income' : 'Expense';
    toast({
      title: `${actionType} added`,
      description: `${expenseData.amount} for ${expenseData.category}${expenseData.note ? ` - ${expenseData.note}` : ''}`,
    });
  };

  const updateExpense = async (id: string, updatedFields: Partial<Omit<Expense, 'id'>>) => {
    if (user) {
      try {
        // Update expense in Supabase
        const { error } = await supabase
          .from('expenses')
          .update({
            ...updatedFields,
            amount: updatedFields.amount,
          })
          .eq('id', id);
        
        if (error) {
          throw error;
        }
        
        // Refresh expenses from database
        const { data, error: fetchError } = await supabase
          .from('expenses')
          .select('*')
          .order('date', { ascending: false });
          
        if (fetchError) {
          throw fetchError;
        }
        
        // Convert database expenses to frontend expenses
        const convertedExpenses: Expense[] = (data as DatabaseExpense[]).map(dbExpense => ({
          id: dbExpense.id,
          amount: Number(dbExpense.amount),
          category: dbExpense.category as any,
          date: new Date(dbExpense.date),
          type: dbExpense.type as 'expense' | 'income',
          note: dbExpense.note
        }));
        
        setExpenses(convertedExpenses);
      } catch (error) {
        console.error('Error updating expense:', error);
        toast({
          title: 'Error updating expense',
          description: 'Failed to update your expense.',
          variant: 'destructive',
        });
        return;
      }
    } else {
      // Update in local state if not logged in
      setExpenses(prev => prev.map(expense => 
        expense.id === id ? { ...expense, ...updatedFields } : expense
      ));
    }
    
    toast({
      title: 'Expense updated',
      description: 'Your expense was updated successfully.',
    });
  };

  const deleteExpense = async (id: string) => {
    if (user) {
      try {
        // Delete expense from Supabase
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', id);
        
        if (error) {
          throw error;
        }
        
        // Update local state
        setExpenses(prev => prev.filter(expense => expense.id !== id));
      } catch (error) {
        console.error('Error deleting expense:', error);
        toast({
          title: 'Error deleting expense',
          description: 'Failed to delete your expense.',
          variant: 'destructive',
        });
        return;
      }
    } else {
      // Delete from local state if not logged in
      setExpenses(prev => prev.filter(expense => expense.id !== id));
    }
    
    toast({
      title: 'Expense deleted',
      description: 'Your expense was deleted successfully.',
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
    <ExpenseContext.Provider value={{ 
      expenses, 
      addExpense, 
      updateExpense,
      deleteExpense,
      totalSpent, 
      totalIncome, 
      balance 
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};
