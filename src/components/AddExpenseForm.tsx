
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryType, TransactionType } from "@/types/expense";
import { CategoryPill } from "./CategoryPill";
import { useExpenses } from "@/context/ExpenseContext";
import { PlusCircle, MinusCircle, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const AddExpenseForm = ({ onClose }: { onClose: () => void }) => {
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("other");
  const [transactionType, setTransactionType] = useState<TransactionType>("expense");
  const [date, setDate] = useState<Date>(new Date());
  const { addExpense } = useExpenses();

  const categories: CategoryType[] = ["food", "transport", "entertainment", "shopping", "other"];

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
