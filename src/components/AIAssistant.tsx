import React, { useState, useRef } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Bot } from 'lucide-react';
import { AuthDialog } from './expense-form/AuthDialog';

export const AIAssistant = ({ onClose }: { onClose: () => void }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { expenses, totalSpent, totalIncome, balance } = useExpenses();
  const { user } = useAuth();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const toggleRecording = async () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Convert speech to text (simplified mock implementation)
        const userQuestion = await processSpeechToText(audioBlob);
        setQuestion(userQuestion);
        await getAIAnswer(userQuestion);
        
        // Clean up the stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsRecording(false);
    }
  };

  // Mock implementation - in a real app this would use a speech-to-text API
  const processSpeechToText = async (audioBlob: Blob): Promise<string> => {
    // This is a placeholder that would normally connect to a speech-to-text service
    // For demo purposes, we'll use some example questions
    const exampleQuestions = [
      "How much did I spend this month?",
      "What category do I spend the most on?",
      "How can I improve my savings?",
      "Should I reduce my expenses?"
    ];
    return exampleQuestions[Math.floor(Math.random() * exampleQuestions.length)];
  };

  const getAIAnswer = async (questionText: string) => {
    setIsLoading(true);
    
    // Prepare financial data summary
    const categories = expenses.reduce((acc: Record<string, number>, expense) => {
      if (expense.type === 'expense') {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      }
      return acc;
    }, {});
    
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    
    // Mock AI response based on the question and financial data
    let aiResponse = '';
    
    if (questionText.toLowerCase().includes('spend')) {
      aiResponse = `You've spent a total of Rp. ${totalSpent.toLocaleString('id-ID')} so far. `;
      if (topCategory) {
        aiResponse += `Your highest spending category is ${topCategory[0]} at Rp. ${topCategory[1].toLocaleString('id-ID')}.`;
      }
    } else if (questionText.toLowerCase().includes('category')) {
      if (topCategory) {
        aiResponse = `Your highest spending category is ${topCategory[0]} at Rp. ${topCategory[1].toLocaleString('id-ID')}. `;
        aiResponse += `This represents ${((topCategory[1]/totalSpent)*100).toFixed(0)}% of your total expenses.`;
      } else {
        aiResponse = `You don't have any categorized expenses yet.`;
      }
    } else if (questionText.toLowerCase().includes('saving') || questionText.toLowerCase().includes('improve')) {
      if (balance < 0) {
        aiResponse = `You're currently spending more than your income. Consider cutting back on ${topCategory ? topCategory[0] : 'your top expenses'} to improve your savings.`;
      } else {
        aiResponse = `You're currently saving about ${((balance/totalIncome)*100).toFixed(0)}% of your income. `;
        aiResponse += `Financial experts recommend saving at least 20% of your income.`;
      }
    } else if (questionText.toLowerCase().includes('reduce')) {
      aiResponse = `If you want to reduce expenses, look at your highest spending category: ${topCategory ? topCategory[0] : 'your top category'}. `;
      aiResponse += `Try setting a budget that's 10-15% lower than your current spending in that category.`;
    } else {
      aiResponse = `I can help answer questions about your spending, saving habits, and provide financial advice based on your expense tracking data.`;
    }
    
    // Delay to simulate API call
    setTimeout(() => {
      setAnswer(aiResponse);
      setIsLoading(false);
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    if (!question.trim()) return;
    await getAIAnswer(question);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Bot size={24} className="text-primary" />
        <h2 className="text-lg font-medium">SaldoAI, your personal finance assistant!</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about your finances..."
            className="flex-1 rounded-md border p-2 text-sm"
          />
          <Button 
            type="button" 
            onClick={toggleRecording}
            variant="outline"
            className={isRecording ? "bg-red-100" : ""}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </Button>
          <Button type="submit" disabled={!question.trim() || isLoading}>
            Ask
          </Button>
        </div>
      </form>
      
      {isLoading && (
        <div className="p-4 rounded-md bg-muted flex justify-center">
          <div className="animate-pulse">Getting answer...</div>
        </div>
      )}
      
      {answer && !isLoading && (
        <div className="p-4 rounded-md bg-primary/10 border border-primary/20">
          <p className="text-sm">{answer}</p>
        </div>
      )}
      
      <div className="pt-2">
        <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
      </div>

      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
        description="Please sign in to use the AI consultant."
      />
    </div>
  );
};
