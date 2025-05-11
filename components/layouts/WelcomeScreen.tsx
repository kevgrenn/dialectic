"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDialogue } from "@/lib/context/DialogueContext";
import { ArrowRight, RefreshCw, Send, Sparkles } from "lucide-react";
import { generatePerspectiveResponse } from "@/lib/api/openai";
import { toast } from "sonner";

const WelcomeScreen: React.FC = () => {
  const { state, dispatch } = useDialogue();
  const [initialPrompt, setInitialPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize the conversation with the user's initial prompt
  const startConversation = async () => {
    if (!initialPrompt.trim()) return;
    
    setIsProcessing(true);
    
    // Add user message and set up initial perspectives
    dispatch({ type: "ADD_USER_MESSAGE", payload: initialPrompt });
    
    // Set up initial perspective information
    dispatch({
      type: "SET_PERSPECTIVE_A",
      payload: {
        name: "Supporter",
        description: "Affirms and extends core ideas",
        messages: [],
      },
    });
    
    dispatch({
      type: "SET_PERSPECTIVE_B",
      payload: {
        name: "Critic",
        description: "Challenges assumptions and offers alternatives",
        messages: [],
      },
    });
    
    // Immediately transition to conversation view
    dispatch({ type: "SET_STAGE", payload: "conversation" });
    
    // Then fetch the AI responses in the background
    try {
      dispatch({ type: "START_PROCESSING" });
      
      // Generate initial response from Perspective A
      const responseA = await generatePerspectiveResponse('supporter', initialPrompt);
      dispatch({ type: "ADD_PERSPECTIVE_A_MESSAGE", payload: responseA });
      
      // Generate initial response from Perspective B
      const responseB = await generatePerspectiveResponse('critic', initialPrompt);
      dispatch({ type: "ADD_PERSPECTIVE_B_MESSAGE", payload: responseB });
      
    } catch (error) {
      console.error("Error initializing conversation:", error);
      toast.error("Failed to initialize the conversation. Please check your API key and try again.");
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to initialize the conversation. Please check your API key and try again.",
      });
    } finally {
      setIsProcessing(false);
      dispatch({ type: "STOP_PROCESSING" });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="mx-auto max-w-3xl w-full">
        <div className="mb-8 flex justify-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold tracking-tight mb-4 text-center">Dialectic</h1>
        <p className="text-xl text-muted-foreground mb-8 text-center">
          Improve your understanding through structured dialectical conversations.
        </p>
        
        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-lg border shadow-sm max-w-[340px] mx-auto w-full">
              <h2 className="text-lg font-semibold mb-2">Share Your Thoughts</h2>
              <p className="text-muted-foreground text-sm">
                Type your ideas to explore them dialectically.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-lg border shadow-sm max-w-[340px] mx-auto w-full">
              <h2 className="text-lg font-semibold mb-2">Dialectical Analysis</h2>
              <p className="text-muted-foreground text-sm">
                AI generates two opposing perspectives on your ideas.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-lg border shadow-sm max-w-[340px] mx-auto w-full">
              <h2 className="text-lg font-semibold mb-2">Gain New Insights</h2>
              <p className="text-muted-foreground text-sm">
                Discover deeper understanding through structured debate.
              </p>
            </div>
          </div>
          
          <div className="bg-secondary/30 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">How It Works</h2>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-2 text-left">
              <li>Enter your thoughts on any topic you want to explore</li>
              <li>Two AI perspectives analyze your ideas from different angles</li>
              <li>Join the conversation to refine your thinking</li>
              <li>Generate a synthesis of the key insights and remaining questions</li>
            </ol>
          </div>
        </div>
        
        <div className="bg-card rounded-lg p-6 shadow-sm border mb-6">
          <h2 className="text-xl font-semibold mb-4">Enter Your Topic or Question</h2>
          <p className="text-muted-foreground mb-6">
            Share your thoughts on a topic you'd like to explore from multiple perspectives.
            Be as detailed as possible for better results.
          </p>
          
          <div className="space-y-4">
            <Textarea
              value={initialPrompt}
              onChange={(e) => setInitialPrompt(e.target.value)}
              placeholder="E.g., I'm considering implementing a four-day work week at my company. I think it could improve productivity and employee satisfaction, but I'm concerned about potential downsides..."
              className="min-h-[200px] text-base"
            />
            
            <div className="flex justify-end">
              <Button 
                onClick={startConversation}
                disabled={!initialPrompt.trim() || isProcessing}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Begin Dialectic <Send className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen; 