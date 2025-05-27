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
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
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
    <div className="max-w-md mx-auto h-screen pt-4 px-1 sm:py-4 flex flex-col relative safe-area-container">
      {!loading &&
        (user ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-1 absolute right-4 top-4 z-20"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAuthOpen(true)}
            className="flex items-center gap-1 absolute right-4 top-4 z-20"
          >
            <User size={16} />
            <span>Sign In</span>
          </Button>
        ))}

      <SummaryCard />

      <div className="flex-1 overflow-y-auto">
        <ExpensesList />
      </div>

      {/* AI Assistant Button */}
      <button
        onClick={() => setIsAssistantOpen(true)}
        className="ask-ai-button bg-expense-dark text-white"
        aria-label="AI Assistant"
      >
        <Bot size={28} />
      </button>

      {/* Add Tracking Button */}
      <button
        onClick={() => setIsAddingExpense(true)}
        className="add-expense-button bg-expense-dark text-white"
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

      {/* AI Assistant Dialog */}
      <Dialog open={isAssistantOpen} onOpenChange={setIsAssistantOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AI Finance Assistant</DialogTitle>
          </DialogHeader>
          <AIAssistant onClose={() => setIsAssistantOpen(false)} />
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

      <style jsx>{`
        .safe-area-container {
          padding-top: max(1rem, env(safe-area-inset-top));
        }
      `}</style>
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
