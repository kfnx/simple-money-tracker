import { Expense } from "@/types/expense";
import { CategoryPill } from "./CategoryPill";
import { format } from "date-fns";
import { PlusCircle, MinusCircle } from "lucide-react";

interface ExpenseItemProps {
  expense: Expense;
}

export const ExpenseItem = ({ expense }: ExpenseItemProps) => {
  const isIncome = expense.type === 'income';
  
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex flex-col">
        <div className="flex items-center">
          {isIncome ? (
            <PlusCircle size={16} className="text-green-600 mr-1" />
          ) : (
            <MinusCircle size={16} className="text-destructive mr-1" />
          )}
          <span className={`text-lg font-semibold ${isIncome ? 'text-green-600' : ''}`}>
            Rp. {expense.amount.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">
            {format(expense.date, 'MMM d, h:mm a')}
          </span>
          {expense.note && (
            <span className="text-sm text-muted-foreground italic">
              {expense.note}
            </span>
          )}
        </div>
      </div>
      {!isIncome && <CategoryPill category={expense.category} />}
    </div>
  );
};
