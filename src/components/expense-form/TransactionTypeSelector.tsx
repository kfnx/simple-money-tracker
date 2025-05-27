
import { Button } from "@/components/ui/button";
import { TransactionType } from "@/types/expense";
import { PlusCircle, MinusCircle } from "lucide-react";

interface TransactionTypeSelectorProps {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
}

export const TransactionTypeSelector = ({ value, onChange }: TransactionTypeSelectorProps) => {
  return (
    <div>
      <label className="font-medium block mb-2">Transaction Type</label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={value === 'expense' ? 'default' : 'outline'}
          className={value === 'expense' ? 'bg-destructive text-destructive-foreground' : ''}
          onClick={() => onChange('expense')}
        >
          <MinusCircle className="mr-2" size={18} />
          Expense
        </Button>
        <Button
          type="button"
          variant={value === 'income' ? 'default' : 'outline'}
          className={value === 'income' ? 'bg-green-600 text-white hover:bg-green-700' : ''}
          onClick={() => onChange('income')}
        >
          <PlusCircle className="mr-2" size={18} />
          Income
        </Button>
      </div>
    </div>
  );
};
