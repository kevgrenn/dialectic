"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDialogue } from "@/lib/context/DialogueContext";
import { RefreshCw, Send } from "lucide-react";
import { generatePerspectiveResponse } from "@/lib/api/openai";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

const WelcomeScreen: React.FC = () => {
  const { dispatch } = useDialogue();
  const [initialPrompt, setInitialPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [formContent, setFormContent] = useState<React.ReactNode | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Initialize the conversation with the user's initial prompt
  const startConversation = async () => {
    if (!initialPrompt.trim()) return;
    
    // Save the form content for transition animation
    setFormContent(
      <div className="min-h-[200px] flex-grow">
        <p className="text-sm leading-relaxed">{initialPrompt}</p>
      </div>
    );
    
    setIsProcessing(true);
    setIsAnimating(true);
    
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
    
    // Store transition data in context for the conversation view to pick up
    dispatch({ 
      type: "SET_TRANSITION_DATA", 
      payload: {
        isTransitioning: true,
        userPrompt: initialPrompt
      }
    });
    
    // Longer delay to allow animations to complete (10x slower)
    setTimeout(() => {
      // Transition to conversation view
      dispatch({ type: "SET_STAGE", payload: "conversation" });
      
      // Then fetch the AI responses in the background
      try {
        dispatch({ type: "START_PROCESSING" });
        dispatch({ type: "CLEAR_STREAMING_RESPONSES" });
        
        // Generate initial response from Perspective A with streaming
        let streamingResponseA = '';
        generatePerspectiveResponse(
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
        ).then(responseA => {
          dispatch({ type: "ADD_PERSPECTIVE_A_MESSAGE", payload: responseA });
          
          // Clear streaming responses before starting the next one
          dispatch({ type: "CLEAR_STREAMING_RESPONSES" });
          
          // Generate initial response from Perspective B with streaming
          let streamingResponseB = '';
          return generatePerspectiveResponse(
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
        }).then(responseB => {
          dispatch({ type: "ADD_PERSPECTIVE_B_MESSAGE", payload: responseB });
          // Reset transition state
          dispatch({ 
            type: "SET_TRANSITION_DATA", 
            payload: {
              isTransitioning: false,
              userPrompt: ""
            }
          });
        }).catch(error => {
          console.error("Error initializing conversation:", error);
          toast.error("Failed to initialize the conversation. Please check your API key and try again.");
          dispatch({
            type: "SET_ERROR",
            payload: "Failed to initialize the conversation. Please check your API key and try again.",
          });
        }).finally(() => {
          setIsProcessing(false);
          dispatch({ type: "STOP_PROCESSING" });
          dispatch({ type: "CLEAR_STREAMING_RESPONSES" });
        });
      } catch (error) {
        console.error("Error initializing conversation:", error);
        toast.error("Failed to initialize the conversation. Please check your API key and try again.");
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to initialize the conversation. Please check your API key and try again.",
        });
        setIsProcessing(false);
        dispatch({ type: "STOP_PROCESSING" });
      }
    }, 15000); // 10x slower: 1500ms → 15000ms
  };

  return (
    <div className="w-full mx-auto min-h-screen">
      {/* Center logo */}
      <motion.div 
        className="absolute left-1/2 transform -translate-x-1/2 top-[108px] z-10"
        initial={{ scale: 1, y: 15 }}
        animate={{ 
          scale: isAnimating ? 0.8 : 1,
          y: isAnimating ? 40 : 0,
          opacity: isAnimating ? 0 : 1,
        }}
        transition={{ duration: isAnimating ? 12 : 0.5 }} // Only slow during transition
      >
        <div className="flex flex-col items-center">
          <Image 
            src="/Dialectic@2x.png" 
            alt="Dialectic" 
            width={158} 
            height={45} 
            className="mb-8"
          />
          <motion.div
            initial={{ y: 30 }}
            animate={{
              y: isAnimating ? 60 : 0,
              scale: isAnimating ? 0.8 : 1, 
              opacity: isAnimating ? 0 : 1,
            }}
            transition={{ duration: isAnimating ? 10 : 0.5, delay: isAnimating ? 1 : 0 }} // Only slow during transition
          >
            <Image 
              src="/user-intro@2x.png" 
              alt="User" 
              width={56} 
              height={56} 
            />
          </motion.div>
        </div>
      </motion.div>
      
      <div className="flex flex-col justify-start items-center h-screen">
        {/* User Section - Centered card matching the user card in conversation layout */}
        <motion.div 
          className="min-w-[320px] max-w-[360px] w-full relative" 
          initial={{ y: 60 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }} // Restore normal speed
          style={{ 
            marginTop: '260px', 
            height: 'calc(100vh - (260px) - 70px)',
            maxHeight: '600px',
            minHeight: '240px'
          }}
        >
          {/* Supporter icon on left side */}
          <motion.div 
            className="absolute left-[-40px] top-[32px] z-10"
            initial={{ opacity: 0, x: 40 }}
            animate={{ 
              opacity: isAnimating ? 0 : 1, 
              x: isAnimating ? -40 : 0,
            }}
            transition={{ duration: isAnimating ? 5 : 0.5, delay: isAnimating ? 1 : 0 }} // Only slow during transition
          >
            <Image 
              src="/supporter-intro@2x.png" 
              alt="Supporter" 
              width={56} 
              height={56} 
            />
          </motion.div>
          
          {/* Critic icon on right side */}
          <motion.div 
            className="absolute right-[-40px] top-[32px] z-10"
            initial={{ opacity: 0, x: -40 }}
            animate={{ 
              opacity: isAnimating ? 0 : 1, 
              x: isAnimating ? 40 : 0,
            }}
            transition={{ duration: isAnimating ? 5 : 0.5, delay: isAnimating ? 1 : 0 }} // Only slow during transition
          >
            <Image 
              src="/critic-intro@2x.png" 
              alt="Critic" 
              width={56} 
              height={56} 
            />
          </motion.div>
          
          <motion.div
            ref={cardRef}
            layout
            className="w-full h-full"
            initial={{ opacity: 1 }}
            animate={{ 
              opacity: 1,
              scale: isAnimating ? 1.02 : 1
            }}
            transition={{ duration: isAnimating ? 5 : 0.5 }} // Only slow during transition
          >
            <Card 
              className="flex flex-col rounded-lg bg-white border-0 w-full h-full relative z-10"
              style={{ 
                boxShadow: "var(--card-shadow)"
              }}
            >
              <CardContent className="flex flex-col p-4 h-full">
                <AnimatePresence mode="wait">
                  {isAnimating ? (
                    <motion.div
                      key="submittedContent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 5 }} // Keep slow for transition
                      className="flex-grow"
                    >
                      {formContent}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="formContent"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7, delay: 0.1 }} // Slightly longer than card animation
                      className="flex-grow"
                    >
                      <p className="text-[18px] leading-[24px] tracking-[-0.01em] font-[400] font-heading text-[#3d3d3d] text-center mb-6">
                        Improve your thinking through structured conversations with two opposing viewpoints.
                      </p>
                      
                      <div className="flex flex-col flex-grow relative">
                        <Textarea
                          value={initialPrompt}
                          onChange={(e) => setInitialPrompt(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && initialPrompt.trim()) {
                              e.preventDefault();
                              startConversation();
                            }
                          }}
                          placeholder="What's on your mind?"
                          className="min-h-[200px] flex-grow text-base mb-4 border-2 border-[#3A3A3A] placeholder:text-[#848484]"
                          disabled={isAnimating}
                        />
                        
                        <Button 
                          onClick={startConversation}
                          disabled={!initialPrompt.trim() || isProcessing || isAnimating}
                          className="absolute bottom-[22px] right-[10px] p-2 h-auto"
                          variant="ghost"
                        >
                          {isProcessing ? (
                            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                          ) : (
                            <Send className="h-6 w-6 text-primary" />
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Hidden perspective images that will animate out during transition */}
      <motion.div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0"
        initial={{ scale: 0, opacity: 0, rotate: 0 }}
        animate={{ 
          scale: isAnimating ? [0, 1, 1] : 0,
          opacity: isAnimating ? [0, 0.5, 0] : 0,
          x: isAnimating ? [0, -200] : 0,
          rotate: isAnimating ? [0, -360] : 0
        }}
        transition={{ 
          duration: 8, // Keep slow for transition animation
          times: [0, 0.6, 1]
        }}
      >
        <Image 
          src="/support.png" 
          alt="Support" 
          width={56} 
          height={56}
        />
      </motion.div>
      
      <motion.div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0"
        initial={{ scale: 0, opacity: 0, rotate: 0 }}
        animate={{ 
          scale: isAnimating ? [0, 1, 1] : 0,
          opacity: isAnimating ? [0, 0.5, 0] : 0,
          x: isAnimating ? [0, 200] : 0,
          rotate: isAnimating ? [0, 360] : 0
        }}
        transition={{ 
          duration: 8, // Keep slow for transition animation
          times: [0, 0.6, 1]
        }}
      >
        <Image 
          src="/critical.png" 
          alt="Critic" 
          width={56} 
          height={56}
        />
      </motion.div>
    </div>
  );
};

export default WelcomeScreen; 