import { useExpenses } from "@/context/ExpenseContext";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

export const SummaryCard = () => {
  const { totalSpent, totalIncome, balance } = useExpenses();

  return (
    <Card className="bg-gradient-to-br from-expense-light to-expense-default">
      <CardContent className="p-5">
        <div className="flex flex-col gap-3">
          {/* Balance */}
          <div>
            <h2 className="text-sm font-medium text-white/80 mb-1">Balance</h2>
            <p className="text-3xl font-bold text-white flex items-center">
              Rp  {balance.toLocaleString('id-ID')}
              {balance !== 0 && (
                balance > 0 
                  ? <ArrowUp className="ml-1 text-green-300" size={20} /> 
                  : <ArrowDown className="ml-1 text-red-300" size={20} />
              )}
              {balance === 0 && <Minus className="ml-1 text-white/70" size={20} />}
            </p>
          </div>
          
          {/* Income and Expenses in a flex row */}
          <div className="flex justify-between mt-2">
            <div>
              <h3 className="text-xs font-medium text-white/70">Income</h3>
              <p className="text-lg font-semibold text-white">Rp  {totalIncome.toLocaleString('id-ID')}</p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-white/70">Expenses</h3>
              <p className="text-lg font-semibold text-white">Rp  {totalSpent.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
