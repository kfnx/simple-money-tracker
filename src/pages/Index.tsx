
import { useState } from "react";
import { SummaryCard } from "@/components/SummaryCard";
import { ExpensesList } from "@/components/ExpensesList";
import { AddExpenseForm } from "@/components/AddExpenseForm";
import { ExpenseProvider } from "@/context/ExpenseContext";
import { Plus, Bot } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AIConsultant } from "@/components/AIConsultant";

const Index = () => {
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isConsultantOpen, setIsConsultantOpen] = useState(false);

  return (
    <ExpenseProvider>
      <div className="max-w-md mx-auto h-screen pt-4 px-4 pb-24 flex flex-col">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-center">Simple Money Tracker</h1>
        </header>
        
        <SummaryCard />
        
        <div className="flex-1 overflow-y-auto">
          <ExpensesList />
        </div>

        {/* AI Consultant Button */}
        <button 
          onClick={() => setIsConsultantOpen(true)}
          className="ask-ai-button bg-expense-dark text-white mx-auto"
          aria-label="AI Consultant"
        >
          <Bot size={28} />
        </button>

        {/* Add Tracking Button */}
        <button 
          onClick={() => setIsAddingExpense(true)}
          className="add-expense-button bg-expense-dark text-white mx-auto"
          aria-label="Add Tracking"
        >
          <Plus size={28} />
        </button>

        {/* Add Tracking Dialog */}
        <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Tracking</DialogTitle>
            </DialogHeader>
            <AddExpenseForm onClose={() => setIsAddingExpense(false)} />
          </DialogContent>
        </Dialog>

        {/* AI Consultant Dialog */}
        <Dialog open={isConsultantOpen} onOpenChange={setIsConsultantOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>AI Finance Consultant</DialogTitle>
            </DialogHeader>
            <AIConsultant onClose={() => setIsConsultantOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </ExpenseProvider>
  );
};

export default Index;
