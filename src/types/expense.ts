
export type CategoryType = 'food' | 'transport' | 'entertainment' | 'shopping' | 'other';

export interface Expense {
  id: string;
  amount: number;
  category: CategoryType;
  date: Date;
}
