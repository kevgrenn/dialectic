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
import { motion } from "framer-motion";

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
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Set initial speaker based on processing state
  useEffect(() => {
    if (state.isProcessing && state.perspectiveA.messages.length === 0) {
      setCurrentSpeaker(SpeakingTurn.PerspectiveA);
    }
    
    // Start with animation in progress, complete it after a delay (10x slower)
    const timer = setTimeout(() => {
      setAnimationComplete(true);
      // Reset transition data after animation completes
      if (state.transitionData.isTransitioning) {
        dispatch({ 
          type: "SET_TRANSITION_DATA", 
          payload: {
            isTransitioning: false,
            userPrompt: ""
          }
        });
      }
    }, 10000); // 10x slower: 1000ms → 10000ms
    
    return () => clearTimeout(timer);
  }, [state.isProcessing, state.perspectiveA.messages.length, state.transitionData.isTransitioning, dispatch]);

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

  // Animation variants
  const perspectiveCardVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 5, // 10x slower: 0.5s → 5s
        ease: "easeOut"
      }
    }
  };

  // Animation variants for elements coming from welcome screen
  const fromWelcomeVariants = {
    initial: (isTransitioning: boolean) => ({
      opacity: isTransitioning ? 0 : 0.9,
      scale: isTransitioning ? 0.9 : 0.95,
      y: isTransitioning ? 20 : 0
    }),
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 5, // 10x slower: 0.5s → 5s
        ease: "easeOut"
      }
    }
  };

  // Render the conversation
  return (
    <div className="w-full mx-auto h-[calc(100vh-80px)]">
      {/* Center logo */}
      <motion.div 
        className="absolute left-1/2 transform -translate-x-1/2 top-[56px] z-10"
        initial={{ 
          y: state.transitionData.isTransitioning ? -40 : -10, 
          scale: state.transitionData.isTransitioning ? 0.8 : 0.9,
          opacity: state.transitionData.isTransitioning ? 0.5 : 1
        }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 5 }} // 10x slower: 0.5s → 5s
      >
        <div className="flex flex-col items-center">
          <Image 
            src="/Dialectic@2x.png" 
            alt="Dialectic" 
            width={200} 
            height={40} 
            className="mb-4"
          />
          <Image 
            src="/user-convo@2x.png" 
            alt="User" 
            width={80} 
            height={80} 
          />
        </div>
      </motion.div>
      
      <div className="flex justify-center h-full">
        <div className="flex flex-wrap justify-center gap-4 max-w-[1100px] relative h-full pt-[72px]">
          {/* Perspective A */}
          <motion.div 
            className="flex-1 min-w-[300px] max-w-[360px] h-full"
            variants={perspectiveCardVariants}
            initial="hidden"
            animate="visible"
            transition={{
              delay: 2 // 10x slower: 0.2s → 2s
            }}
          >
            <div className="relative h-full">
              {/* Support Image */}
              <motion.div 
                className="absolute top-[12px] right-[-40px] z-0"
                initial={{ x: -200, opacity: 0, scale: 1.2 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 6, delay: 1 }} // 10x slower: 0.6s → 6s, 0.1s → 1s
              >
                <Image 
                  src="/supporter-convo@2x.png" 
                  alt="Support" 
                  width={56} 
                  height={56} 
                  className=""
                />
              </motion.div>
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
          </motion.div>
          
          {/* User Section */}
          <motion.div 
            className="flex-1 min-w-[320px] max-w-[360px] relative h-full pt-[78px]"
            custom={state.transitionData.isTransitioning}
            variants={fromWelcomeVariants}
            initial="initial"
            animate="animate"
          >
            <Card 
              className="h-full flex flex-col rounded-lg bg-white border-0 w-full relative z-10"
              style={{ 
                boxShadow: "var(--card-shadow)"
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
                    placeholder="Continue the conversation..."
                    className="min-h-[100px] text-sm mb-4 mx-4"
                    disabled={isSubmitting || state.isProcessing}
                  />
                  
                  <div className="flex justify-end pb-4 px-4">
                    <Button
                      onClick={() => void handleUserMessage(message)}
                      disabled={!message.trim() || isSubmitting || state.isProcessing}
                      className="gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send <Send className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Perspective B */}
          <motion.div 
            className="flex-1 min-w-[300px] max-w-[360px] h-full"
            variants={perspectiveCardVariants}
            initial="hidden"
            animate="visible"
            transition={{
              delay: 4 // 10x slower: 0.4s → 4s
            }}
          >
            <div className="relative h-full">
              {/* Critic Image */}
              <motion.div 
                className="absolute top-[12px] left-[-40px] z-0"
                initial={{ x: 200, opacity: 0, scale: 1.2 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 6, delay: 3 }} // 10x slower: 0.6s → 6s, 0.3s → 3s
              >
                <Image 
                  src="/critic-convo@2x.png" 
                  alt="Critic" 
                  width={56} 
                  height={56} 
                  className=""
                />
              </motion.div>
              <div className="relative z-10 h-full">
                <PerspectiveCard
                  name={state.perspectiveB.name || "Critic"}
                  description={state.perspectiveB.description || "Loading..."}
                  messages={state.perspectiveB.messages}
                  streamingMessage={state.streamingResponseB}
                  avatarLetter="B"
                  avatarColor="red"
                  isSpeaking={currentSpeaker === SpeakingTurn.PerspectiveB}
                  isLoading={state.isProcessing && state.perspectiveA.messages.length > 0 && state.perspectiveB.messages.length === 0 && !state.streamingResponseB}
                />
              </div>
            </div>
          </motion.div>
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