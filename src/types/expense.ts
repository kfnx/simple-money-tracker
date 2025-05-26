
export type CategoryType = 'food' | 'transport' | 'entertainment' | 'shopping' | 'other';
export type TransactionType = 'expense' | 'income';

export interface Expense {
  id: string;
  amount: number;
  category: string; // Changed from CategoryType to string to support custom categories
  date: Date;
  type: TransactionType;
  note?: string;
}

export interface DatabaseExpense {
  id: string;
  amount: number;
  category: string;
  date: string;
  type: string;
  note?: string;
  user_id: string;
}

export interface CustomCategory {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  background_color: string;
  created_at: string;
  updated_at: string;
}
