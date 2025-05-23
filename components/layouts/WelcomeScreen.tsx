"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDialogue } from "@/lib/context/DialogueContext";
import { RefreshCw } from "lucide-react";
import { generatePerspectiveResponse } from "@/lib/api/openai";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

interface WelcomeScreenProps {
  hideCard?: boolean;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ hideCard = false }) => {
  const { dispatch } = useDialogue();
  const [initialPrompt, setInitialPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [cardLoaded, setCardLoaded] = useState(false);
  const [formContent, setFormContent] = useState<React.ReactNode | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Set card as loaded after initial render
  React.useEffect(() => {
    // Delay icon animations until after the card is loaded
    const timer = setTimeout(() => {
      setCardLoaded(true);
    }, 500);  // 2 second delay

    return () => clearTimeout(timer);
  }, []);

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
        description: "Pokes holes with wit and sarcasm",
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
    
    // Move the logo first before transitioning screens
    setTimeout(() => {
      // Transition to conversation view without any delay
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
    }, 300); // Reduced to nearly immediate transition
  };

  return (
    <div className="w-full mx-auto min-h-screen">
      {/* Center logo */}
      <motion.div 
        className="absolute left-1/2 transform -translate-x-1/2 top-[108px]"
        style={{ zIndex: 50 }} // Logo always on top
        initial={{ scale: 1, y: 15, opacity: 1 }}
        animate={{ 
          scale: 1,
          y: isAnimating ? -52 : 0, // Just move up to final position (108px -> 56px)
          opacity: 1, // Always fully opaque
        }}
        transition={{ 
          duration: isAnimating ? 0.5 : 0.5,
          ease: "easeInOut"
        }}
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
            className="w-[56px] h-[56px]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
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
        {/* Subheadline positioned above the card */}
        <motion.div
          className="text-center max-w-[460px] w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginTop: '254px', marginBottom: '40px' }}
        >
          <p className="text-[18px] leading-[24px] tracking-[-0.01em] font-[400] font-heading text-[#3d3d3d] mb-0.5">
            Think Better, Together
          </p>
          <p className="text-[18px] leading-[24px] tracking-[-0.01em] font-[400] font-heading text-[#3d3d3d]">
            Get Multiple Viewpoints On Your Ideas
          </p>
        </motion.div>
        
        {/* User Section - Centered card matching the user card in conversation layout */}
        <motion.div 
          className="w-[360px] relative" 
          initial={{ y: 60 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ 
            marginTop: '20px', 
            height: 'calc(100vh - (360px) - 70px)',
            maxHeight: '500px',
            minHeight: '240px',
            position: 'relative',
            zIndex: 15 // Establish stacking context
          }}
        >
          {/* Only render the card if not hidden */}
          {!hideCard && (
            <motion.div
              ref={cardRef}
              layout
              className="w-full h-full"
              style={{ position: "relative", zIndex: 20 }} // Card container always above icons
              initial={{ opacity: 1 }}
              animate={{ 
                opacity: 1,
              }}
              transition={{ duration: isAnimating ? 5 : 0.5 }}
            >
              <Card 
                className="flex flex-col rounded-lg bg-white border-0 w-full h-full relative p-0"
                style={{ 
                  boxShadow: "var(--card-shadow)"
                }}
              >
                <CardContent className="flex flex-col p-0 h-full border-0">
                  <AnimatePresence mode="wait">
                    {isAnimating ? (
                      <motion.div
                        key="submittedContent"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex-grow p-4"
                      >
                        {formContent}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="formContent"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="flex-grow h-full"
                      >
                        <div className="flex flex-col h-full">
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
                            className="flex-grow h-full text-base pt-4 border-0 placeholder:text-[#848484] resize-none"
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
                              <Image 
                                src="/arrow-right-bold.svg" 
                                alt="Send" 
                                width={24} 
                                height={24} 
                                className="h-6 w-6 text-primary"
                              />
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Supporter icon on left side - positioned behind the card */}
          <motion.div 
            className="absolute left-[-40px] top-[32px]"
            style={{ zIndex: 5 }} // Always behind card
            initial={{ opacity: 0, x: 40 }}
            animate={{ 
              opacity: isAnimating ? 0 : (cardLoaded ? 1 : 0),
              x: isAnimating ? 40 : (cardLoaded ? 0 : 40),
            }}
            transition={{ 
              opacity: { duration: 0.4 },
              x: { duration: 0.6 },
              ease: "easeInOut"
            }}
          >
            <Image 
              src="/supporter-intro@2x.png" 
              alt="Supporter" 
              width={56} 
              height={56} 
            />
          </motion.div>
          
          {/* Critic icon on right side - positioned behind the card */}
          <motion.div 
            className="absolute right-[-40px] top-[32px]"
            style={{ zIndex: 5 }} // Always behind card
            initial={{ opacity: 0, x: -40 }}
            animate={{ 
              opacity: isAnimating ? 0 : (cardLoaded ? 1 : 0),
              x: isAnimating ? -40 : (cardLoaded ? 0 : -40),
            }}
            transition={{ 
              opacity: { duration: 0.4 },
              x: { duration: 0.8 },
              ease: "easeInOut"
            }}
          >
            <Image 
              src="/critic-intro@2x.png" 
              alt="Critic" 
              width={56} 
              height={56} 
            />
          </motion.div>
        </motion.div>
      </div>
      
      {/* Hidden perspective images that will animate out during transition - remove or simplify */}
      <motion.div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 0,
          opacity: 0,
          x: 0
        }}
        transition={{ duration: 0 }}
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
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 0,
          opacity: 0,
          x: 0
        }}
        transition={{ duration: 0 }}
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