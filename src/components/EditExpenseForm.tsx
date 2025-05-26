
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Expense, TransactionType } from "@/types/expense";
import { CategoryPill } from "./CategoryPill";
import { useExpenses } from "@/context/ExpenseContext";
import { useCategories } from "@/context/CategoryContext";
import { PlusCircle, MinusCircle, Trash2, CalendarIcon, Settings } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryManager } from "./CategoryManager";
import { NumberInput } from "./NumberInput";
import { useAuth } from "@/context/AuthContext";

interface EditExpenseFormProps {
  expense: Expense;
  onClose: () => void;
}

export const EditExpenseForm = ({ expense, onClose }: EditExpenseFormProps) => {
  const [amount, setAmount] = useState<string>(expense.amount.toString());
  const [note, setNote] = useState<string>(expense.note || "");
  const [selectedCategory, setSelectedCategory] = useState<string>(expense.category);
  const [transactionType, setTransactionType] = useState<TransactionType>(expense.type);
  const [date, setDate] = useState<Date>(expense.date);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  
  const { updateExpense, deleteExpense } = useExpenses();
  const { getAllCategories } = useCategories();
  const { user } = useAuth();

  const allCategories = getAllCategories();

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

  const handleCategoryManage = () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    setShowCategoryManager(true);
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
            <NumberInput
              id="amount"
              placeholder="0"
              className="pl-12 text-xl h-14"
              value={amount}
              onChange={setAmount}
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
            maxLength={128}
          />
          <div className="text-xs text-muted-foreground mt-1">
            {note.length}/128 characters
          </div>
        </div>

        {transactionType === 'expense' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-lg font-medium">Category</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCategoryManage}
                className="flex items-center gap-1"
              >
                <Settings size={16} />
                Manage
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((category) => (
                <CategoryPill
                  key={category.name}
                  category={category.name}
                  selected={selectedCategory === category.name}
                  onClick={() => setSelectedCategory(category.name)}
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

      {/* Category Manager Dialog */}
      <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Category Manager</DialogTitle>
          </DialogHeader>
          <CategoryManager onClose={() => setShowCategoryManager(false)} />
        </DialogContent>
      </Dialog>

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Please sign in to manage categories.</p>
            {/* Add auth forms here or redirect to main auth dialog */}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
