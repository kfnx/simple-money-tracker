import { useState } from "react";
import { Expense, TransactionType } from "@/types/expense";
import { useExpenses } from "@/context/ExpenseContext";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryManager } from "./CategoryManager";
import { TransactionTypeSelector } from "./expense-form/TransactionTypeSelector";
import { AmountInput } from "./expense-form/AmountInput";
import { DateSelector } from "./expense-form/DateSelector";
import { NoteInput } from "./expense-form/NoteInput";
import { CategorySelector } from "./expense-form/CategorySelector";
import { FormActions } from "./expense-form/FormActions";
import { AuthDialog } from "./expense-form/AuthDialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
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
  // Initialize form state with expense data
  const [amount, setAmount] = useState<string>(expense.amount.toString());
  const [note, setNote] = useState<string>(expense.note || "");
  const [selectedCategory, setSelectedCategory] = useState<string>(expense.category);
  const [transactionType, setTransactionType] = useState<TransactionType>(expense.type);
  const [date, setDate] = useState<Date>(expense.date);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  
  const { updateExpense, deleteExpense } = useExpenses();
  const { user } = useAuth();

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
        {/* Transaction type selector (expense/income) */}
        <TransactionTypeSelector 
          value={transactionType} 
          onChange={setTransactionType} 
        />

        {/* Amount input with currency formatting */}
        <AmountInput 
          value={amount} 
          onChange={setAmount} 
        />

        {/* Date picker */}
        <DateSelector 
          value={date} 
          onChange={setDate} 
        />

        {/* Optional note input */}
        <NoteInput 
          value={note} 
          onChange={setNote} 
        />

        {/* Category selector (only shown for expenses) */}
        {transactionType === 'expense' && (
          <CategorySelector
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onManageCategories={handleCategoryManage}
          />
        )}

        <div className="flex flex-col gap-3">
          {/* Form action buttons */}
          <FormActions 
            onCancel={onClose}
            amount={amount}
            transactionType={transactionType}
            submitLabel="Save"
          />
          
          {/* Delete button */}
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
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
      />

      {/* Delete Confirmation Dialog */}
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
