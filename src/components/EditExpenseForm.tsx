
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryType, Expense, TransactionType } from "@/types/expense";
import { CategoryPill } from "./CategoryPill";
import { useExpenses } from "@/context/ExpenseContext";
import { PlusCircle, MinusCircle, Trash2, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface EditExpenseFormProps {
  expense: Expense;
  onClose: () => void;
}

export const EditExpenseForm = ({ expense, onClose }: EditExpenseFormProps) => {
  const [amount, setAmount] = useState<string>(expense.amount.toString());
  const [note, setNote] = useState<string>(expense.note || "");
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(expense.category);
  const [transactionType, setTransactionType] = useState<TransactionType>(expense.type);
  const [date, setDate] = useState<Date>(expense.date);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { updateExpense, deleteExpense } = useExpenses();

  const categories: CategoryType[] = ["food", "transport", "entertainment", "shopping", "other"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    
    updateExpense(expense.id, {
      amount: numAmount,
      category: transactionType === 'income' ? 'other' : selectedCategory,
      type: transactionType,
      note: note.trim() || undefined,
      date: date
    });
    
    onClose();
  };

  const handleDelete = () => {
    deleteExpense(expense.id);
    onClose();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-lg font-medium block mb-2">Transaction Type</label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={transactionType === 'expense' ? 'default' : 'outline'}
              className={transactionType === 'expense' ? 'bg-destructive text-destructive-foreground' : ''}
              onClick={() => setTransactionType('expense')}
            >
              <MinusCircle className="mr-2" size={18} />
              Expense
            </Button>
            <Button
              type="button"
              variant={transactionType === 'income' ? 'default' : 'outline'}
              className={transactionType === 'income' ? 'bg-green-600 text-white hover:bg-green-700' : ''}
              onClick={() => setTransactionType('income')}
            >
              <PlusCircle className="mr-2" size={18} />
              Income
            </Button>
          </div>
        </div>

        <div>
          <label htmlFor="amount" className="text-lg font-medium block mb-2">
            How much?
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl font-semibold text-muted-foreground">
              Rp.
            </span>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              className="pl-12 text-xl h-14"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="text-lg font-medium block mb-2">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-14",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label htmlFor="note" className="text-lg font-medium block mb-2">
            Note (optional)
          </label>
          <Input
            id="note"
            type="text"
            placeholder="Add a note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {transactionType === 'expense' && (
          <div>
            <label className="text-lg font-medium block mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <CategoryPill
                  key={category}
                  category={category}
                  selected={selectedCategory === category}
                  onClick={() => setSelectedCategory(category)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="lg"
              className={`flex-1 ${
                transactionType === 'income' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-expense-dark hover:bg-expense-default'
              }`}
              disabled={!amount || parseFloat(amount) <= 0}
            >
              Save
            </Button>
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            className="text-red-500 border-red-500 hover:bg-red-50"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 size={16} className="mr-2" />
            Delete
          </Button>
        </div>
      </form>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
