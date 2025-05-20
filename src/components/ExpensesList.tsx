
import { useExpenses } from "@/context/ExpenseContext";
import { ExpenseItem } from "./ExpenseItem";

export const ExpensesList = () => {
  const { expenses } = useExpenses();

  if (expenses.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No expenses yet</p>
        <p className="text-gray-400 text-sm">Add your first expense below</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y">
      {expenses.map((expense) => (
        <ExpenseItem key={expense.id} expense={expense} />
      ))}
    </div>
  );
};
