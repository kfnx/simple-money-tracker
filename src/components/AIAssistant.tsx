import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Bot, Send, User } from "lucide-react";
import { AuthDialog } from "./expense-form/AuthDialog";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistant = ({ onClose }: { onClose: () => void }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { user } = useAuth();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [question]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Clean up microphone when component unmounts or dialog closes
  useEffect(() => {
    return () => {
      stopRecordingAndCleanup();
    };
  }, []);

  const stopRecordingAndCleanup = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const toggleRecording = async () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    if (isRecording) {
      // Stop recording
      stopRecordingAndCleanup();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
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

        // Convert speech to text
        const userQuestion = await processSpeechToText(audioBlob);
        setQuestion(userQuestion);
        await getAIAnswer(userQuestion);

        // Clean up the stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setIsRecording(false);
    }
  };

  // Updated onClose to only stop recording, not clear chat history
  const handleClose = () => {
    stopRecordingAndCleanup();
    onClose();
  };

  const processSpeechToText = async (audioBlob: Blob): Promise<string> => {
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      // Get the user's session to pass to the edge function
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No valid session found");
      }

      const { data, error } = await supabase.functions.invoke(
        "speech-to-text",
        {
          body: {
            audioData: base64Audio,
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

      return data.text;
    } catch (error) {
      console.error("Error processing speech to text:", error);
      throw error;
    }
  };

  const getAIAnswer = async (questionText: string) => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    setIsLoading(true);

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
            chatHistory: chatHistory, // Pass chat history for context
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

      // Add user message and AI response to chat history
      setChatHistory(prev => [
        ...prev,
        { role: 'user', content: questionText },
        { role: 'assistant', content: data.response || "Sorry, I could not generate a response at this time." }
      ]);

    } catch (error) {
      console.error("Error getting AI response:", error);
      setChatHistory(prev => [
        ...prev,
        { role: 'user', content: questionText },
        { role: 'assistant', content: "I apologize, but I encountered an error while processing your question. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
      setQuestion(""); // Clear input after sending
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
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Bot size={24} className="text-primary" />
        <h2 className="font-medium">Hello, I'm SaldoAI!</h2>
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        Ask me anything about your finances. I'll analyze your actual spending
        patterns and provide personalized advice!
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {chatHistory.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-2 ${
              message.role === 'assistant' ? 'justify-start' : 'justify-end'
            }`}
          >
            {message.role === 'assistant' && (
              <Bot size={20} className="text-primary mt-0.5 flex-shrink-0" />
            )}
            <div
              className={`p-3 rounded-lg max-w-[80%] ${
                message.role === 'assistant'
                  ? 'bg-primary/10 border border-primary/20'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <User size={20} className="text-primary-foreground mt-0.5 flex-shrink-0" />
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-2">
            <Bot size={20} className="text-primary mt-0.5 flex-shrink-0" />
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <div className="text-sm">Analyzing your financial data...</div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4 relative">
        <textarea
          ref={textareaRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your finances..."
          className="w-full rounded-md border p-2 pb-12 text-sm min-h-[40px] max-h-[200px] resize-none overflow-hidden"
          rows={2}
        />
        <div className="flex justify-end gap-2 absolute bottom-3 right-2">
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
