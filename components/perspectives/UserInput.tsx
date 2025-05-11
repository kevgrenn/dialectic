"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDialogue } from "@/lib/context/DialogueContext";
import { Send, Loader2 } from "lucide-react";

interface UserInputProps {
  onSubmit: (message: string) => Promise<void>;
  disabled?: boolean;
}

const UserInput: React.FC<UserInputProps> = ({ onSubmit, disabled = false }) => {
  const { state } = useDialogue();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(message);
      setMessage("");
    } catch (error) {
      console.error("Error submitting message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="w-full bg-card rounded-lg p-4 shadow-sm border">
      <h3 className="text-lg font-medium mb-2">Your Input</h3>
      <div className="flex flex-col gap-3">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add your thoughts to the conversation..."
          className="min-h-[100px] text-base"
          disabled={disabled || isSubmitting || state.isProcessing}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || disabled || isSubmitting || state.isProcessing}
            className="gap-2"
          >
            {isSubmitting || state.isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserInput; 