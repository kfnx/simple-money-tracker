
import { Button } from "@/components/ui/button";
import { TransactionType } from "@/types/expense";

interface FormActionsProps {
  onCancel: () => void;
  amount: string;
  transactionType: TransactionType;
  submitLabel?: string;
}

export const FormActions = ({ onCancel, amount, transactionType, submitLabel = 'Save' }: FormActionsProps) => {
  return (
    <div className="flex gap-3">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="flex-1" 
        onClick={onCancel}
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
        {submitLabel}
      </Button>
    </div>
  );
};
