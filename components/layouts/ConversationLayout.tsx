"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import PerspectiveCard from "@/components/perspectives/PerspectiveCard";
import { Textarea } from "@/components/ui/textarea";
import { useDialogue } from "@/lib/context/DialogueContext";
import { ArrowRight, File, RefreshCw } from "lucide-react";
import { generatePerspectiveResponse, generateSynthesis } from "@/lib/api/openai";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

// Enum for whose turn it is
enum SpeakingTurn {
  PerspectiveA,
  PerspectiveB,
  User,
}

// Enum for active tab in mobile view
enum ActiveTab {
  Supporter = "supporter",
  User = "user",
  Critic = "critic"
}

interface ConversationLayoutProps {
  hideLogo?: boolean;
  hideCard?: boolean;
}

const ConversationLayout: React.FC<ConversationLayoutProps> = ({ hideLogo = false, hideCard = false }) => {
  const { state, dispatch } = useDialogue();
  const [currentSpeaker, setCurrentSpeaker] = useState<SpeakingTurn>(SpeakingTurn.User);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Add state for mobile tab view
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.Supporter);
  
  // Check if we're on mobile
  const isMobile = useMediaQuery("(max-width: 640px)");
  
  // Force mobile view for development/testing
  // const isMobile = true;
  
  // Set initial speaker based on processing state
  useEffect(() => {
    if (state.isProcessing && state.perspectiveA.messages.length === 0) {
      setCurrentSpeaker(SpeakingTurn.PerspectiveA);
    }
    
    // Start with animation in progress, complete it after a brief delay
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
    }, 300); // Very short delay for immediate transition
    
    return () => clearTimeout(timer);
  }, [state.isProcessing, state.perspectiveA.messages.length, state.transitionData.isTransitioning, dispatch]);

  // Update active tab when speaker changes
  useEffect(() => {
    if (isMobile) {
      if (currentSpeaker === SpeakingTurn.PerspectiveA) {
        setActiveTab(ActiveTab.Supporter);
      } else if (currentSpeaker === SpeakingTurn.PerspectiveB) {
        setActiveTab(ActiveTab.Critic);
      }
    }
  }, [currentSpeaker, isMobile]);

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
      scale: 1,
      y: 50
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3, // Faster animation
        ease: "easeOut"
      }
    }
  };

  // Animation variants for elements coming from welcome screen
  const fromWelcomeVariants = {
    initial: (isTransitioning: boolean) => ({
      opacity: isTransitioning ? 1 : 0.9, // Start visible when transitioning
      scale: isTransitioning ? 1 : 0.95,
      y: isTransitioning ? 0 : 10
    }),
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  // Animation variants for the logo - ensures it stays fully visible
  const logoVariants = {
    initial: { opacity: 1, y: 0 },
    animate: { opacity: 1, y: 0 },
  };

  // Render mobile tab icons
  const renderMobileTabIcons = () => (
    <div className="flex justify-center space-x-8 my-4 py-2 fixed left-0 right-0 top-21 z-50 ">
      <button 
        onClick={() => setActiveTab(ActiveTab.Supporter)}
        className={`flex flex-col items-center ${activeTab === ActiveTab.Supporter ? 'opacity-100 scale-100 overflow-hidden h-[56px] ' : 'opacity-100 pt-3 overflow-hidden h-[42px] '} transition-all`}
        aria-label="Supporter perspective"
      >
        <Image 
          src="/supporter-convo@2x.png" 
          alt="Supporter" 
          width={56} 
          height={56}
          className={`${activeTab === ActiveTab.Supporter && currentSpeaker === SpeakingTurn.PerspectiveA ? '' : ''}`}
        />
      </button>
      
      <button 
        onClick={() => setActiveTab(ActiveTab.User)}
        className={`flex flex-col items-center ${activeTab === ActiveTab.User ? 'opacity-100 scale-100 overflow-hidden h-[56px] ' : 'opacity-100 pt-3 overflow-hidden h-[42px]'} transition-all`}
        aria-label="Your perspective"
      >
        <Image 
          src="/user-convo@2x.png" 
          alt="User" 
          width={56} 
          height={56}
          className={`${activeTab === ActiveTab.User && currentSpeaker === SpeakingTurn.User ? '' : ''}`}
        />
      </button>
      
      <button 
        onClick={() => setActiveTab(ActiveTab.Critic)}
        className={`flex flex-col items-center ${activeTab === ActiveTab.Critic ? 'opacity-100 scale-100 overflow-hidden h-[56px] ' : 'opacity-100 pt-3 overflow-hidden h-[42px] '} transition-all`}
        aria-label="Critic perspective"
      >
        <Image 
          src="/critic-convo@2x.png" 
          alt="Critic" 
          width={56} 
          height={56}
          className={`${activeTab === ActiveTab.Critic && currentSpeaker === SpeakingTurn.PerspectiveB ? '' : ''}`}
        />
      </button>
    </div>
  );

  // Render the conversation
  return (
    <div className={`w-full mx-auto h-[calc(100vh)] ${animationComplete ? 'animation-complete' : ''}`}>
      {/* Center logo - only render if not hidden */}
      {!hideLogo && (
        <motion.div 
          className="absolute left-1/2 transform -translate-x-1/2 top-[56px] z-50"
          variants={logoVariants}
          initial="initial"
          animate="animate"
          style={{ opacity: 1 }}
          transition={{ duration: 0 }}
        >
          <motion.div 
            className="flex flex-col items-center" 
            style={{ opacity: 1 }}
          >
            <Image 
              src="/Dialectic@2x.png" 
              alt="Dialectic" 
              width={158} 
              height={45} 
              className="mb-6"
              style={{ opacity: 1 }}
            />
            {!isMobile && (
              <Image 
                src="/user-convo@2x.png" 
                alt="User" 
                width={56} 
                height={56} 
              />
            )}
          </motion.div>
        </motion.div>
      )}
      
      {/* Mobile Tab Navigation */}
      {isMobile && (
        renderMobileTabIcons()
      )}
      
      <div className="flex justify-center h-full">
        <div className={`
          ${isMobile ? 'flex-col w-full rounded-0' : 'flex-wrap max-w-[1112px] gap-4'} 
          flex justify-center relative h-full
          ${isMobile ? 'pt-[150px]' : 'pt-[72px]'}
        `}>
          {/* Perspective A - Supporter */}
          <motion.div 
            className={`
              ${isMobile ? 
                `${activeTab === ActiveTab.Supporter ? 'block' : 'hidden'} w-full h-full` : 
                'flex-1 w-[360px] h-full'}
            `}
            variants={perspectiveCardVariants}
            initial="hidden"
            animate="visible"
            transition={{
              delay: 0.23 // First card to appear
            }}
          >
            <div className="relative h-full">
              {/* Support Image - only show on desktop */}
              {!isMobile && (
                <motion.div 
                  className="absolute top-[12px] right-[-40px] z-0"
                  initial={{ x: state.transitionData.isTransitioning ? -100 : -200, opacity: state.transitionData.isTransitioning ? 0 : 0, scale: 1 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.3}} // Faster animation
                >
                  <Image 
                    src="/supporter-convo@2x.png" 
                    alt="Support" 
                    width={56} 
                    height={56} 
                    className=""
                  />
                </motion.div>
              )}
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
                  isMobile={isMobile}
                />
              </div>
            </div>
          </motion.div>
          
          {/* User Section */}
          <motion.div 
            className={`
              ${isMobile ? 
                `${activeTab === ActiveTab.User ? 'block' : 'hidden'} w-full h-full` : 
                'flex-1 w-[360px] relative h-full pt-[78px] rounded-0'}
            `}
            custom={state.transitionData.isTransitioning}
            variants={fromWelcomeVariants}
            initial="initial"
            animate="animate"
            transition={{
              delay: 0.7 // Last card to appear, clearly after the background card animation completes
            }}
          >
            {/* Only render the card if not hidden */}
            {!hideCard && (
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
                  
                  <div className="border-t pt-0">
                    <div className="relative">
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Continue the conversation..."
                        className={`
                          h-[200px] text-base pt-4 border-0 placeholder:text-[#848484] resize-none rounded-t-none rounded-b-md
                          ${isMobile ? 'w-full m-0' : 'w-[356px] m-0.5'}
                        `}
                        disabled={isSubmitting || state.isProcessing}
                      />
                      
                      {state.userMessages.length > 0 && (
                        <Button
                          onClick={handleGenerateSynthesis}
                          aria-label="Generate Synthesis"
                          variant="ghost"
                          className="absolute bottom-[10px] left-[10px] p-2 gap-1 h-auto"
                          disabled={isSubmitting || state.isProcessing}
                        > 
                          {state.isProcessing ? (
                            <File className="h-6 w-6 text-gray-400" />
                          ) : (
                            <File className="h-6 w-6 text-gray-400" />
                          )}Summarize
                        </Button>
                      )}
                      
                      <Button 
                        onClick={() => void handleUserMessage(message)}
                        disabled={!message.trim() || isSubmitting || state.isProcessing}
                        className="absolute bottom-[10px] right-[10px] p-2 gap-1"
                        variant="ghost"
                      >
                        {isSubmitting || state.isProcessing ? (
                          <RefreshCw className="h-10 w-10 animate-spin text-primary" />
                        ) : (
                          <ArrowRight className="text-primary" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
          
          {/* Perspective B - Critic */}
          <motion.div 
            className={`
              ${isMobile ? 
                `${activeTab === ActiveTab.Critic ? 'block' : 'hidden'} w-full h-full` : 
                'flex-1 w-[360px] h-full'}
            `}
            variants={perspectiveCardVariants}
            initial="hidden"
            animate="visible"
            transition={{
              delay: 0.4 // Second card to appear
            }}
          >
            <div className="relative h-full">
              {/* Critic Image - only show on desktop */}
              {!isMobile && (
                <motion.div 
                  className="absolute top-[12px] left-[-40px] z-0"
                  initial={{ x: state.transitionData.isTransitioning ? 100 : 200, opacity: state.transitionData.isTransitioning ? 0 : 0, scale: 1 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.9 }} // Faster animation
                >
                  <Image 
                    src="/critic-convo@2x.png" 
                    alt="Critic" 
                    width={56} 
                    height={56} 
                    className=""
                  />
                </motion.div>
              )}
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
                  isMobile={isMobile}
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