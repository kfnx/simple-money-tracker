import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Bot, Send } from "lucide-react";
import { AuthDialog } from "./expense-form/AuthDialog";
import { supabase } from "@/integrations/supabase/client";

export const AIAssistant = ({ onClose }: { onClose: () => void }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { user } = useAuth();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [question]);

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
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });

        // Convert speech to text (simplified mock implementation)
        const userQuestion = await processSpeechToText(audioBlob);
        setQuestion(userQuestion);
        await getAIAnswer(userQuestion);

        // Clean up the stream
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
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
      "Should I reduce my expenses?",
      "What's my spending pattern like?",
      "How is my financial health?",
      "Where should I cut back on spending?",
    ];
    return exampleQuestions[
      Math.floor(Math.random() * exampleQuestions.length)
    ];
  };

  const getAIAnswer = async (questionText: string) => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    setIsLoading(true);
    setAnswer("");

    try {
      console.log("Getting AI response for:", questionText);

      // Get the user's session to pass to the edge function
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No valid session found");
      }

      const { data, error } = await supabase.functions.invoke(
        "ai-finance-chat",
        {
          body: {
            question: questionText,
            authToken: session.access_token,
          },
        }
      );

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setAnswer(
        data.response || "Sorry, I could not generate a response at this time."
      );
    } catch (error) {
      console.error("Error getting AI response:", error);
      setAnswer(
        "I apologize, but I encountered an error while processing your question. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
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
        <h2 className="font-medium">Hello, I'm SaldoAI!</h2>
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        Ask me anything about your finances. I'll analyze your actual spending
        patterns and provide personalized advice!
      </div>

      {isLoading && (
        <div className="p-4 rounded-md bg-muted flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <div>Analyzing your financial data...</div>
        </div>
      )}

      {answer && !isLoading && (
        <div className="p-4 rounded-md bg-primary/10 border border-primary/20">
          <div className="flex items-start gap-2">
            <Bot size={20} className="text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm whitespace-pre-wrap">{answer}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          ref={textareaRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your finances..."
          className="w-full rounded-md border p-2 text-sm min-h-[40px] max-h-[200px] resize-none overflow-hidden"
          rows={1}
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            onClick={toggleRecording}
            variant="outline"
            className={isRecording ? "bg-red-100" : ""}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
            disabled={isLoading}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </Button>
          <Button type="submit" disabled={!question.trim() || isLoading}>
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send size={20} />
            )}
          </Button>
        </div>
      </form>

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        description="Please sign in to use the AI consultant. I need access to your financial data to provide personalized advice."
      />
    </div>
  );
};
