"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import PerspectiveCard from "@/components/perspectives/PerspectiveCard";
import { Textarea } from "@/components/ui/textarea";
import { useDialogue } from "@/lib/context/DialogueContext";
import { ArrowRight, RefreshCw, Send, Loader2 } from "lucide-react";
import { generatePerspectiveResponse, generateSynthesis } from "@/lib/api/openai";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

// Enum for whose turn it is
enum SpeakingTurn {
  PerspectiveA,
  PerspectiveB,
  User,
}

const ConversationLayout: React.FC = () => {
  const { state, dispatch } = useDialogue();
  const [currentSpeaker, setCurrentSpeaker] = useState<SpeakingTurn>(SpeakingTurn.User);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Set initial speaker based on processing state
  useEffect(() => {
    if (state.isProcessing && state.perspectiveA.messages.length === 0) {
      setCurrentSpeaker(SpeakingTurn.PerspectiveA);
    }
  }, [state.isProcessing, state.perspectiveA.messages.length]);

  // Handle user message submission
  const handleUserMessage = async (message: string): Promise<void> => {
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    dispatch({ type: "ADD_USER_MESSAGE", payload: message });
    dispatch({ type: "START_PROCESSING" });
    
    try {
      // Prepare conversation history
      const conversationHistory = [
        ...state.userMessages.map((msg, i) => `User (${i+1}): ${msg}`),
        ...state.perspectiveA.messages.map((msg, i) => `Supporter (${i+1}): ${msg}`),
        ...state.perspectiveB.messages.map((msg, i) => `Critic (${i+1}): ${msg}`),
      ];
      
      // Clear streaming responses
      dispatch({ type: "CLEAR_STREAMING_RESPONSES" });
      
      // After user speaks, Perspective A responds
      setCurrentSpeaker(SpeakingTurn.PerspectiveA);
      dispatch({ type: "CLEAR_STREAMING_RESPONSES" });
      
      let streamingResponseA = '';
      const responseA = await generatePerspectiveResponse(
        'supportive', 
        message, 
        conversationHistory,
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
      
      // Then Perspective B responds
      setCurrentSpeaker(SpeakingTurn.PerspectiveB);
      dispatch({ type: "CLEAR_STREAMING_RESPONSES" });
      
      let streamingResponseB = '';
      const responseB = await generatePerspectiveResponse(
        'critical', 
        message, 
        conversationHistory,
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
      
      // Set next turn to user
      setCurrentSpeaker(SpeakingTurn.User);
      setMessage("");
    } catch (error) {
      console.error("Error generating responses:", error);
      toast.error("Failed to generate AI responses. Please check your API key and try again.");
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to generate AI responses. Please check your API key and try again.",
      });
    } finally {
      setIsSubmitting(false);
      dispatch({ type: "STOP_PROCESSING" });
      dispatch({ type: "CLEAR_STREAMING_RESPONSES" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleUserMessage(message);
    }
  };

  // Generate synthesis
  const handleGenerateSynthesis = async (): Promise<void> => {
    dispatch({ type: "START_PROCESSING" });
    dispatch({ type: "CLEAR_STREAMING_SYNTHESIS" });
    
    try {
      // Generate synthesis using OpenAI with streaming
      const synthesis = await generateSynthesis(
        state.userMessages,
        state.perspectiveA.messages,
        state.perspectiveB.messages,
        (chunk) => {
          dispatch({ type: "UPDATE_STREAMING_SYNTHESIS", payload: chunk });
        }
      );
      
      dispatch({ type: "SET_SYNTHESIS", payload: synthesis });
      dispatch({ type: "SET_STAGE", payload: "synthesis" });
      toast.success("Synthesis generated successfully!");
    } catch (error) {
      console.error("Error generating synthesis:", error);
      toast.error("Failed to generate synthesis. Please check your API key and try again.");
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to generate synthesis. Please check your API key and try again.",
      });
    } finally {
      dispatch({ type: "STOP_PROCESSING" });
    }
  };

  // Render the conversation
  return (
    <div className="w-full mx-auto h-[calc(100vh-80px)]">
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
      
      <div className="flex justify-center h-full">
        <div className="flex flex-wrap justify-center gap-4 max-w-[1100px] relative h-full pt-[72px]">
          {/* Perspective A */}
          <div className="flex-1 min-w-[300px] max-w-[360px] h-full">
            <div className="relative h-full">
              {/* Support Image */}
              <div className="absolute top-[12px] right-[-40px] z-0">
                <Image 
                  src="/support.png" 
                  alt="Support" 
                  width={56} 
                  height={56} 
                  className=""
                />
              </div>
              <div className="relative z-10 h-full">
                <PerspectiveCard
                  name={state.perspectiveA.name || "Supporter"}
                  description={state.perspectiveA.description || "Loading..."}
                  messages={state.perspectiveA.messages}
                  streamingMessage={state.streamingResponseA}
                  avatarLetter="A"
                  avatarColor="blue"
                  isSpeaking={currentSpeaker === SpeakingTurn.PerspectiveA}
                  isLoading={state.isProcessing && state.perspectiveA.messages.length === 0 && !state.streamingResponseA}
                />
              </div>
            </div>
          </div>
          
          {/* User Section */}
          <div className="flex-1 min-w-[320px] max-w-[360px] relative h-full pt-[78px]">
            <Card 
              className="h-full flex flex-col rounded-lg bg-white border-0 w-full relative z-10"
              style={{ 
                boxShadow: "0px 1px 4px 0px rgba(12, 12, 13, 0.05)"
              }}
            >
              <CardContent className="flex flex-col h-full p-0">                
                {/* Messages area */}
                <ScrollArea className="flex-grow mb-4 h-full pr-2">
                  <div className="space-y-3">
                    {state.userMessages.length === 0 ? (
                      <p className="text-muted-foreground italic text-center">
                        Your messages will appear here...
                      </p>
                    ) : (
                      state.userMessages.map((message, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-md text-sm leading-relaxed"
                        >
                          {message}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
                
                {/* Synthesis button */}
                {state.userMessages.length > 0 && (
                  <div className="flex justify-center my-2">
                    <Button
                      onClick={handleGenerateSynthesis}
                      variant="outline"
                      className="gap-2"
                      disabled={isSubmitting || state.isProcessing}
                    >
                      {state.isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Generating synthesis...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-4 w-4" />
                          Generate Synthesis
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add your thoughts to the conversation..."
                    className="min-h-[80px] text-base mb-2"
                    disabled={currentSpeaker !== SpeakingTurn.User || isSubmitting || state.isProcessing}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleUserMessage(message)}
                      disabled={!message.trim() || currentSpeaker !== SpeakingTurn.User || isSubmitting || state.isProcessing}
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
              </CardContent>
            </Card>
          </div>
          
          {/* Perspective B */}
          <div className="flex-1 min-w-[320px] max-w-[360px] h-full">
            <div className="relative h-full">
              {/* Critical Image */}
              <div className="absolute top-[12px] left-[-40px] z-0">
                <Image 
                  src="/critical.png" 
                  alt="Critical" 
                  width={56} 
                  height={56} 
                  className=""
                />
              </div>
              <div className="relative z-10 h-full">
                <PerspectiveCard
                  name={state.perspectiveB.name || "Critic"}
                  description={state.perspectiveB.description || "Loading..."}
                  messages={state.perspectiveB.messages}
                  streamingMessage={state.streamingResponseB}
                  avatarLetter="B"
                  avatarColor="red"
                  isSpeaking={currentSpeaker === SpeakingTurn.PerspectiveB}
                  isLoading={state.isProcessing && state.perspectiveB.messages.length === 0 && !state.streamingResponseB}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {state.error && (
        <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-md mt-4 max-w-[1100px] mx-auto">
          {state.error}
        </div>
      )}
    </div>
  );
};

export default ConversationLayout; 