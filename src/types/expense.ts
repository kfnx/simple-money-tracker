
export type CategoryType = 'food' | 'transport' | 'entertainment' | 'shopping' | 'other';
export type TransactionType = 'expense' | 'income';

export interface Expense {
  id: string;
  amount: number;
  category: CategoryType;
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
