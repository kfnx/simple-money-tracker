
import { Expense } from "@/types/expense";
import { CategoryPill } from "./CategoryPill";
import { format } from "date-fns";

interface ExpenseItemProps {
  expense: Expense;
}

export const ExpenseItem = ({ expense }: ExpenseItemProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex flex-col">
        <span className="text-lg font-semibold">${expense.amount.toFixed(2)}</span>
        <span className="text-sm text-muted-foreground">
          {format(expense.date, 'MMM d, h:mm a')}
        </span>
      </div>
      <CategoryPill category={expense.category} />
    </div>
  );
};
