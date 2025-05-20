
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryType } from "@/types/expense";
import { CategoryPill } from "./CategoryPill";
import { useExpenses } from "@/context/ExpenseContext";

export const AddExpenseForm = ({ onClose }: { onClose: () => void }) => {
  const [amount, setAmount] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("other");
  const { addExpense } = useExpenses();

  const categories: CategoryType[] = ["food", "transport", "entertainment", "shopping", "other"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    
    addExpense({
      amount: numAmount,
      category: selectedCategory,
    });
    
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="amount" className="text-lg font-medium block mb-2">
          How much?
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl font-semibold text-muted-foreground">
            $
          </span>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            className="pl-8 text-xl h-14"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
        </div>
      </div>

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
          className="flex-1 bg-expense-dark hover:bg-expense-default"
          disabled={!amount || parseFloat(amount) <= 0}
        >
          Save
        </Button>
      </div>
    </form>
  );
};
