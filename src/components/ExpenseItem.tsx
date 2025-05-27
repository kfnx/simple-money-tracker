import { Expense } from "@/types/expense";
import { CategoryPill } from "./CategoryPill";
import { format } from "date-fns";
import { PlusCircle, MinusCircle } from "lucide-react";

interface ExpenseItemProps {
  expense: Expense;
  onClick: (expense: Expense) => void;
}

export const ExpenseItem = ({ expense, onClick }: ExpenseItemProps) => {
  const isIncome = expense.type === "income";

  return (
    <div
      className="flex items-center justify-between py-2 px-4 border-b hover:bg-gray-50 cursor-pointer"
      onClick={() => onClick(expense)}
    >
      <div className="flex flex-col">
        <div className="flex items-center">
          {isIncome ? (
            <PlusCircle size={16} className="text-green-600 mr-1" />
          ) : (
            <MinusCircle size={16} className="text-destructive mr-1" />
          )}
          <span className={isIncome ? "text-green-600" : ""}>
            Rp {expense.amount.toLocaleString("id-ID")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">
            {format(expense.date, "h:mm a")}
          </span>
          {expense.note && (
            <span className="text-xs text-muted-foreground">
              • {expense.note}
            </span>
          )}
        </div>
      </div>
      {!isIncome && <CategoryPill category={expense.category} />}
    </div>
  );
};
