
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryType, TransactionType } from "@/types/expense";
import { CategoryPill } from "./CategoryPill";
import { useExpenses } from "@/context/ExpenseContext";
import { PlusCircle, MinusCircle } from "lucide-react";

export const AddExpenseForm = ({ onClose }: { onClose: () => void }) => {
  const [amount, setAmount] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("other");
  const [transactionType, setTransactionType] = useState<TransactionType>("expense");
  const { addExpense } = useExpenses();

  const categories: CategoryType[] = ["food", "transport", "entertainment", "shopping", "other"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    
    addExpense({
      amount: numAmount,
      category: transactionType === 'income' ? 'other' : selectedCategory,
      type: transactionType
    });
    
    onClose();
  };

  return (
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
            placeholder="0.00"
            className="pl-10 text-xl h-14"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
        </div>
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
    </form>
  );
};
