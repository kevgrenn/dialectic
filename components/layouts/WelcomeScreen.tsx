"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDialogue } from "@/lib/context/DialogueContext";
import { RefreshCw, Send } from "lucide-react";
import { generatePerspectiveResponse } from "@/lib/api/openai";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

const WelcomeScreen: React.FC = () => {
  const { dispatch } = useDialogue();
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
      dispatch({ type: "CLEAR_STREAMING_RESPONSES" });
      
      // Generate initial response from Perspective A with streaming
      let streamingResponseA = '';
      const responseA = await generatePerspectiveResponse(
        'supportive', 
        initialPrompt,
        [],
        (chunk) => {
          // Append the new chunk to the local variable
          streamingResponseA += chunk;
          // Update the state with the complete streaming response so far
          dispatch({ 
            type: "SET_STREAMING_RESPONSE_A", 
            payload: streamingResponseA
          });
        }
      );
      dispatch({ type: "ADD_PERSPECTIVE_A_MESSAGE", payload: responseA });
      
      // Clear streaming responses before starting the next one
      dispatch({ type: "CLEAR_STREAMING_RESPONSES" });
      
      // Generate initial response from Perspective B with streaming
      let streamingResponseB = '';
      const responseB = await generatePerspectiveResponse(
        'critical', 
        initialPrompt,
        [],
        (chunk) => {
          // Append the new chunk to the local variable
          streamingResponseB += chunk;
          // Update the state with the complete streaming response so far
          dispatch({ 
            type: "SET_STREAMING_RESPONSE_B", 
            payload: streamingResponseB
          });
        }
      );
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
      dispatch({ type: "CLEAR_STREAMING_RESPONSES" });
    }
  };

  return (
    <div className="w-full mx-auto min-h-screen">
      {/* Center logo */}
      <div className="absolute left-1/2 transform -translate-x-1/2 top-[56px] z-10">
        <Image 
          src="/logoVert.png" 
          alt="Dialectic" 
          width={158} 
          height={115} 
          className=""
        />
      </div>
      
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex justify-center max-w-[1100px] relative pt-[150px]">
          {/* User Section - Centered card matching the user card in conversation layout */}
          <div className="flex-1 min-w-[320px] max-w-[360px] relative">
            <Card 
              className="flex flex-col rounded-lg bg-white border-0 w-full relative z-10"
              style={{ 
                boxShadow: "0px 1px 4px 0px rgba(12, 12, 13, 0.05)"
              }}
            >
              <CardContent className="flex flex-col p-6">
                <h1 className="text-2xl font-bold mb-4 text-center">Welcome to Dialectic</h1>
                
                <p className="text-muted-foreground mb-6 text-center">
                  Improve your understanding through structured dialectical conversations. 
                  Enter your topic below to explore it from multiple perspectives.
                </p>
                
                <div>
                  <Textarea
                    value={initialPrompt}
                    onChange={(e) => setInitialPrompt(e.target.value)}
                    placeholder="E.g., I'm considering implementing a four-day work week at my company. I think it could improve productivity and employee satisfaction, but I&apos;m concerned about potential downsides..."
                    className="min-h-[200px] text-base mb-4"
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen; 