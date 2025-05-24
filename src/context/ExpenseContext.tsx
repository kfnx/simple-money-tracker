import React, { createContext, useContext, useEffect, useState } from 'react';
import { Expense, DatabaseExpense, CategoryType } from '@/types/expense';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
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
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [localExpenses, setLocalExpenses] = useState<Expense[]>([]);
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
          category: dbExpense.category as CategoryType,
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

  // Check for local expenses when user logs in
  useEffect(() => {
    if (user) {
      const savedExpenses = localStorage.getItem('expenses');
      if (savedExpenses) {
        try {
          const parsedExpenses = JSON.parse(savedExpenses).map((expense: Expense) => ({
            ...expense,
            date: new Date(expense.date),
            type: expense.type || 'expense'
          }));
          setLocalExpenses(parsedExpenses);
          setShowSyncModal(true);
        } catch (error) {
          console.error('Failed to parse saved expenses:', error);
        }
      }
    }
  }, [user]);

  const handleSyncExpenses = async () => {
    try {
      // Add all local expenses to Supabase
      const { error } = await supabase.from('expenses').insert(
        localExpenses.map(expense => ({
          amount: expense.amount,
          category: expense.category,
          type: expense.type,
          note: expense.note,
          user_id: user?.id,
          date: expense.date.toISOString(),
        }))
      );

      if (error) throw error;

      // Clear localStorage
      localStorage.removeItem('expenses');
      setLocalExpenses([]);
      setShowSyncModal(false);

      // Refresh expenses from database
      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;

      const convertedExpenses: Expense[] = (data as DatabaseExpense[]).map(dbExpense => ({
        id: dbExpense.id,
        amount: Number(dbExpense.amount),
        category: dbExpense.category as CategoryType,
        date: new Date(dbExpense.date),
        type: dbExpense.type as 'expense' | 'income',
        note: dbExpense.note
      }));

      setExpenses(convertedExpenses);

      toast({
        title: 'Success',
        description: 'Your local expenses have been synced to your account.',
      });
    } catch (error) {
      console.error('Error syncing expenses:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync your local expenses.',
        variant: 'destructive',
      });
    }
  };

  const handleSkipSync = () => {
    localStorage.removeItem('expenses');
    setLocalExpenses([]);
    setShowSyncModal(false);
  };

  const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: crypto.randomUUID(),
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
          date: newExpense.date.toISOString(),
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
          category: dbExpense.category as CategoryType,
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
        const updateData: any = { ...updatedFields };
        if (updateData.date) {
          updateData.date = updateData.date.toISOString();
        }
        
        const { error } = await supabase
          .from('expenses')
          .update(updateData)
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
          category: dbExpense.category as CategoryType,
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
      <Dialog open={showSyncModal} onOpenChange={setShowSyncModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync Local Expenses</DialogTitle>
            <DialogDescription>
              We found {localExpenses.length} expense(s) in your local storage. Would you like to sync them to your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleSkipSync}>
              Skip
            </Button>
            <Button onClick={handleSyncExpenses}>
              Sync Expenses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ExpenseContext.Provider>
  );
};
