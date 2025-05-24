
import { useState } from "react";
import { useExpenses } from "@/context/ExpenseContext";
import { ExpenseItem } from "./ExpenseItem";
import { Expense } from "@/types/expense";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditExpenseForm } from "./EditExpenseForm";
import { format, isSameDay } from "date-fns";

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

  // Group expenses by date
  const groupedExpenses = expenses.reduce((groups: { [key: string]: Expense[] }, expense) => {
    const dateKey = format(expense.date, 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(expense);
    return groups;
  }, {});

  // Sort the date keys to show most recent first
  const sortedDateKeys = Object.keys(groupedExpenses).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <>
      <div className="flex flex-col space-y-4">
        {sortedDateKeys.map((dateKey) => {
          const expensesForDate = groupedExpenses[dateKey];
          const date = new Date(dateKey);
          const isToday = isSameDay(date, new Date());
          const isYesterday = isSameDay(date, new Date(Date.now() - 24 * 60 * 60 * 1000));
          
          let dateLabel;
          if (isToday) {
            dateLabel = 'Today';
          } else if (isYesterday) {
            dateLabel = 'Yesterday';
          } else {
            dateLabel = format(date, 'EEEE, MMM d');
          }

          return (
            <div key={dateKey} className="space-y-2">
              <div className="px-4 py-2 bg-gray-50 border-b">
                <h3 className="text-sm font-medium text-gray-600">{dateLabel}</h3>
              </div>
              <div className="divide-y">
                {expensesForDate.map((expense) => (
                  <ExpenseItem 
                    key={expense.id} 
                    expense={expense} 
                    onClick={handleExpenseClick}
                  />
                ))}
              </div>
            </div>
          );
        })}
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
