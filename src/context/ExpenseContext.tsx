
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Expense, DatabaseExpense } from '@/types/expense';
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
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Omit<Expense, 'id'>>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  totalSpent: number;
  totalIncome: number;
  balance: number;
  clearData: () => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};

// Utility functions for converting between database and frontend expense formats
const convertDatabaseExpense = (dbExpense: DatabaseExpense): Expense => ({
  id: dbExpense.id,
  amount: Number(dbExpense.amount),
  category: dbExpense.category,
  date: new Date(dbExpense.date),
  type: dbExpense.type as 'expense' | 'income',
  note: dbExpense.note
});

const convertToDatabaseExpense = (expense: Omit<Expense, 'id'>, userId?: string) => ({
  amount: expense.amount,
  category: expense.category,
  type: expense.type,
  note: expense.note,
  user_id: userId,
  date: expense.date.toISOString(),
});

// Helper function to create a normalized key for comparison
const createExpenseKey = (expense: Expense | DatabaseExpense) => {
  const amount = typeof expense.amount === 'string' ? Number(expense.amount) : expense.amount;
  const date = expense.date instanceof Date ? expense.date.toISOString() : expense.date;
  const note = expense.note || '';
  
  return `${amount}-${expense.category}-${date}-${expense.type}-${note}`;
};

// Modal component for syncing local expenses
const SyncModal = ({ 
  onSync, 
  onSkip 
}: { 
  onSync: () => void; 
  onSkip: () => void;
}) => (
  <Dialog open={true}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Sync Local Expenses</DialogTitle>
        <DialogDescription>
          You have local expenses that haven't been synced to your account. Would you like to sync them now?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onSkip}>
          Skip
        </Button>
        <Button onClick={onSync}>
          Sync Now
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [localExpenses, setLocalExpenses] = useState<Expense[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Clear all data (for logout)
  const clearData = () => {
    localStorage.removeItem('expenses');
    setExpenses([]);
    setLocalExpenses([]);
  };

  // Load expenses from Supabase when user is logged in
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
      
      if (error) throw error;
      
      // Convert database expenses to frontend expenses
      const convertedExpenses = (data as DatabaseExpense[]).map(convertDatabaseExpense);
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

  useEffect(() => {
    fetchExpenses();
  }, [user]);

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
          
          // Only show sync modal if there are local expenses
          if (parsedExpenses.length > 0) {
            setLocalExpenses(parsedExpenses);
            setShowSyncModal(true);
          } else {
            // Clean up empty localStorage
            localStorage.removeItem('expenses');
          }
        } catch (error) {
          console.error('Failed to parse saved expenses:', error);
          // Clean up corrupted localStorage
          localStorage.removeItem('expenses');
        }
      }
    }
  }, [user]);

  const handleSyncExpenses = async () => {
    try {
      console.log('Starting sync process...');
      console.log('Local expenses to sync:', localExpenses);

      // First, fetch current expenses from Supabase to check for duplicates
      const { data: existingExpenses, error: fetchError } = await supabase
        .from('expenses')
        .select('*');

      if (fetchError) throw fetchError;

      console.log('Existing expenses in database:', existingExpenses);

      // Create a set of existing expense keys for efficient lookup
      const existingExpensesSet = new Set(
        (existingExpenses as DatabaseExpense[]).map(exp => createExpenseKey(exp))
      );

      console.log('Existing expense keys:', Array.from(existingExpensesSet));

      // Filter out local expenses that might already exist in the database
      const uniqueLocalExpenses = localExpenses.filter(localExp => {
        const localKey = createExpenseKey(localExp);
        const isDuplicate = existingExpensesSet.has(localKey);
        console.log(`Local expense key: ${localKey}, is duplicate: ${isDuplicate}`);
        return !isDuplicate;
      });

      console.log('Unique local expenses to sync:', uniqueLocalExpenses);

      if (uniqueLocalExpenses.length === 0) {
        // All local expenses already exist, just clean up
        localStorage.removeItem('expenses');
        setLocalExpenses([]);
        setShowSyncModal(false);
        await fetchExpenses();

        toast({
          title: 'Already synced',
          description: 'All your local expenses were already in your account.',
        });
        return;
      }

      // Add only the unique local expenses to Supabase
      const expensesToInsert = uniqueLocalExpenses.map(expense => convertToDatabaseExpense(expense, user?.id));
      console.log('Expenses to insert:', expensesToInsert);

      const { error } = await supabase.from('expenses').insert(expensesToInsert);

      if (error) throw error;

      // Clear localStorage and refresh expenses
      localStorage.removeItem('expenses');
      setLocalExpenses([]);
      setShowSyncModal(false);
      await fetchExpenses();

      toast({
        title: 'Success',
        description: `${uniqueLocalExpenses.length} local expenses have been synced to your account.`,
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
        const { error } = await supabase
          .from('expenses')
          .insert(convertToDatabaseExpense(newExpense, user.id));
        
        if (error) throw error;
        await fetchExpenses();
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
  };

  const updateExpense = async (id: string, updatedFields: Partial<Omit<Expense, 'id'>>) => {
    if (user) {
      try {
        // Update expense in Supabase
        const { error } = await supabase
          .from('expenses')
          .update(convertToDatabaseExpense(updatedFields as Omit<Expense, 'id'>, user.id))
          .eq('id', id);
        
        if (error) throw error;
        await fetchExpenses();
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
      setExpenses((prev) =>
        prev.map((expense) =>
          expense.id === id ? { ...expense, ...updatedFields } : expense
        )
      );
    }
  };

  const deleteExpense = async (id: string) => {
    if (user) {
      try {
        // Delete expense from Supabase
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        await fetchExpenses();
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
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    }
  };

  // Calculate totals
  const totalSpent = expenses
    .filter((expense) => expense.type === 'expense')
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalIncome = expenses
    .filter((expense) => expense.type === 'income')
    .reduce((sum, expense) => sum + expense.amount, 0);

  const balance = totalIncome - totalSpent;

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        totalSpent,
        totalIncome,
        balance,
        clearData,
      }}
    >
      {children}
      {showSyncModal && (
        <SyncModal
          onSync={handleSyncExpenses}
          onSkip={handleSkipSync}
        />
      )}
    </ExpenseContext.Provider>
  );
};
