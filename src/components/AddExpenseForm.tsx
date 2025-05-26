
import { useState } from "react";
import { TransactionType } from "@/types/expense";
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

export const AddExpenseForm = ({ onClose }: { onClose: () => void }) => {
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("other");
  const [transactionType, setTransactionType] = useState<TransactionType>("expense");
  const [date, setDate] = useState<Date>(new Date());
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  
  const { addExpense } = useExpenses();
  const { user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    
    addExpense({
      amount: numAmount,
      category: transactionType === 'income' ? 'other' : selectedCategory,
      type: transactionType,
      note: note.trim() || undefined,
      date: date
    });
    
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
        <TransactionTypeSelector 
          value={transactionType} 
          onChange={setTransactionType} 
        />

        <AmountInput 
          value={amount} 
          onChange={setAmount} 
        />

        <DateSelector 
          value={date} 
          onChange={setDate} 
        />

        <NoteInput 
          value={note} 
          onChange={setNote} 
        />

        {transactionType === 'expense' && (
          <CategorySelector
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onManageCategories={handleCategoryManage}
          />
        )}

        <FormActions 
          onCancel={onClose}
          amount={amount}
          transactionType={transactionType}
        />
      </form>

      <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Category Manager</DialogTitle>
          </DialogHeader>
          <CategoryManager onClose={() => setShowCategoryManager(false)} />
        </DialogContent>
      </Dialog>

      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
      />
    </>
  );
};
