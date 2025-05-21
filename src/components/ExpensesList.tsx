
import { useState } from "react";
import { useExpenses } from "@/context/ExpenseContext";
import { ExpenseItem } from "./ExpenseItem";
import { Expense } from "@/types/expense";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditExpenseForm } from "./EditExpenseForm";

export const ExpensesList = () => {
  const { expenses } = useExpenses();
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleExpenseClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsEditDialogOpen(true);
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No expenses yet</p>
        <p className="text-gray-400 text-sm">Add your first expense below</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col divide-y">
        {expenses.map((expense) => (
          <ExpenseItem 
            key={expense.id} 
            expense={expense} 
            onClick={handleExpenseClick}
          />
        ))}
      </div>

      {selectedExpense && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
            </DialogHeader>
            <EditExpenseForm 
              expense={selectedExpense} 
              onClose={() => setIsEditDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
