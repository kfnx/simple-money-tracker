
import { useExpenses } from "@/context/ExpenseContext";
import { Card, CardContent } from "@/components/ui/card";

export const SummaryCard = () => {
  const { totalSpent } = useExpenses();

  return (
    <Card className="bg-gradient-to-br from-expense-light to-expense-default mb-6">
      <CardContent className="pt-6">
        <h2 className="text-sm font-medium text-white/80 mb-1">Total Spent</h2>
        <p className="text-3xl font-bold text-white">${totalSpent.toFixed(2)}</p>
      </CardContent>
    </Card>
  );
};
