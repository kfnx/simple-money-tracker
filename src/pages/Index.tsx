
import { useState } from "react";
import { SummaryCard } from "@/components/SummaryCard";
import { ExpensesList } from "@/components/ExpensesList";
import { AddExpenseForm } from "@/components/AddExpenseForm";
import { ExpenseProvider } from "@/context/ExpenseContext";
import { CategoryProvider } from "@/context/CategoryContext";
import { Plus, Bot, User, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AIAssistant } from "@/components/AIAssistant";
import { AuthForms } from "@/components/AuthForms";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useExpenses } from "@/context/ExpenseContext";
import { useCategories } from "@/context/CategoryContext";

const IndexContent = () => {
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isConsultantOpen, setIsConsultantOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const { clearData: clearExpenseData } = useExpenses();
  const { clearData: clearCategoryData } = useCategories();

  const handleSignOut = async () => {
    await signOut();
    // Clear all context data
    clearExpenseData();
    clearCategoryData();
  };

  return (
    <div className="max-w-md mx-auto h-screen pt-4 px-4 pb-20 flex flex-col">
      <header className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Simple Money Tracker</h1>
        {!loading &&
          (user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-1"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-1"
            >
              <User size={16} />
              <span>Sign In</span>
            </Button>
          ))}
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
            <DialogTitle>AI Finance Assistant</DialogTitle>
          </DialogHeader>
          <AIAssistant onClose={() => setIsConsultantOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Auth Dialog */}
      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account</DialogTitle>
          </DialogHeader>
          <AuthForms onClose={() => setIsAuthOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Index = () => {
  return (
    <CategoryProvider>
      <ExpenseProvider>
        <IndexContent />
      </ExpenseProvider>
    </CategoryProvider>
  );
};

export default Index;
