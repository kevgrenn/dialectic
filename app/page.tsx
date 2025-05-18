"use client";

import { DialogueProvider, useDialogue } from "@/lib/context/DialogueContext";
import WelcomeScreen from "@/components/layouts/WelcomeScreen";
import ConversationScreen from "@/components/layouts/ConversationLayout";
import SynthesisView from "@/components/synthesis/SynthesisView";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

// Persistent logo component that stays visible during screen transitions
const PersistentLogo = () => {
  const { state } = useDialogue();
  const [isFirstRender, setIsFirstRender] = React.useState(true);
  
  React.useEffect(() => {
    // Mark as no longer the first render after mounting
    setIsFirstRender(false);
  }, []);
  
  const isWelcome = state.stage === "welcome";
  const isTransitioning = state.transitionData.isTransitioning;
  const showUserIntro = isWelcome && !isTransitioning;
  const showUserConvo = !isWelcome || isTransitioning;
  
  // Disable transitions on first render to prevent any animation glitches
  const transitionStyle = isFirstRender ? 'none' : 'top 0.5s ease-in-out, margin 0.5s ease-in-out';
  
  return (
    <div 
      className="fixed left-1/2 transform -translate-x-1/2 z-[9] pointer-events-none"
      style={{ 
        top: isWelcome ? "108px" : "56px",
        transition: transitionStyle,
        width: "158px", // Match logo width
        height: "auto",
        willChange: "top, transform", // Optimize for animations
      }}
    >
      <div className="flex flex-col items-center" style={{ width: "158px", height: "auto" }}>
        <motion.div 
          style={{ 
            width: "158px", 
            height: "45px", 
            marginBottom: isWelcome ? "32px" : "24px", 
            willChange: "margin-bottom" 
          }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Image 
            src="/Dialectic@2x.png" 
            alt="Dialectic" 
            width={158} 
            height={45}
            priority={true} // Prioritize loading this image
            style={{ 
              width: "158px",
              height: "45px",
              objectFit: "contain"
            }}
          />
        </motion.div>
        <div className="relative" style={{ width: "56px", height: "56px" }}>
          {showUserIntro && (
            <motion.div 
              className="absolute top-0 left-0" 
              style={{ width: "56px", height: "56px" }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Image 
                src="/user-intro@2x.png" 
                alt="User Intro" 
                width={56} 
                height={56}
                priority={true} // Prioritize loading this image
                style={{ 
                  width: "56px",
                  height: "56px",
                  objectFit: "contain"
                }}
              />
            </motion.div>
          )}
          
          {showUserConvo && (
            <motion.div 
              layout
              className="absolute top-0 left-0"
              style={{ width: "56px", height: "56px" }}
              animate={{ 
                y: [300, -15], 
                opacity: [0, 1] 
              }}
              transition={{ 
                duration: 1.0,
                ease: "easeOut",
                delay: 1.3,
                times: [0, 1]
              }}
            >
              <Image 
                src="/user-convo@2x.png" 
                alt="User Convo" 
                width={56} 
                height={56}
                priority={true} // Prioritize loading this image
                style={{ 
                  width: "56px",
                  height: "56px",
                  objectFit: "contain"
                }}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

// Background card component that sits behind the welcome screen card
const BackgroundCard = () => {
  const { state } = useDialogue();
  const [isFirstRender, setIsFirstRender] = React.useState(true);
  const [isVisible, setIsVisible] = React.useState(false);
  
  React.useEffect(() => {
    // Mark as no longer the first render after mounting
    setIsFirstRender(false);
    
    // Show the card after 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const isWelcome = state.stage === "welcome";
  
  // Get dimensions and position for each screen
  const welcomeStyles = {
    width: '360px',
    height: `min(calc(100vh - 360px - 70px), 500px)`, // Use CSS min function to apply maxHeight directly
    minHeight: '240px',
    top: '365px',
    left: '50%',
    transform: 'translateX(-50%)',
  };
  
  const conversationStyles = {
    width: '360px',
    height: 'calc(100vh - 235px)',
    top: '150px',
    left: '50%',
    transform: 'translateX(-50%)',
  };
  
  // Choose style based on current state
  const currentStyles = isWelcome ? welcomeStyles : conversationStyles;
  
  // Disable transitions on first render to prevent any animation glitches
  const transitionStyle = isFirstRender ? 'none' : 'all 0.3s ease-in-out';
  
  if (!isVisible && isWelcome) {
    return null; // Don't show during initial load on welcome screen
  }
  
  return (
    <div 
      className="fixed pointer-events-none"
      style={{ 
        width: currentStyles.width,
        height: currentStyles.height,
        top: currentStyles.top,
        left: currentStyles.left,
        transform: currentStyles.transform,
        transition: transitionStyle,
        zIndex: 5, // Reduced to ensure it stays behind the welcome screen card (which has z-index 15)
        opacity: state.stage === "synthesis" ? 0 : 1,
        willChange: "top, height, transform",
      }}
    >
      <Card 
        className="flex flex-col rounded-lg bg-white border-0 w-full h-full relative"
        style={{ 
          boxShadow: "var(--card-shadow)"
        }}
      >
        <CardContent className="flex flex-col p-0 h-full border-0">
          {/* Empty content - this is just a visual background card */}
        </CardContent>
      </Card>
    </div>
  );
};

// Main component that conditionally renders based on the current stage
const DialogueStageManager = () => {
  const { state } = useDialogue();

  // Render different components based on the current stage
  return (
    <>
      <PersistentLogo />
      <BackgroundCard />
      
      <AnimatePresence mode="wait">
        {state.stage === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full relative z-10"
          >
            <WelcomeScreen hideLogo={true} />
          </motion.div>
        )}
        
        {state.stage === "conversation" && (
          <motion.div
            key="conversation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full relative z-10"
          >
            <ConversationScreen hideLogo={true} />
          </motion.div>
        )}
        
        {state.stage === "synthesis" && (
          <motion.div
            key="synthesis"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full relative z-10"
          >
            <SynthesisView />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Root page component wrapped with DialogueProvider for state management
export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Preload important images to prevent flickering */}
      <link rel="preload" as="image" href="/Dialectic@2x.png" />
      <link rel="preload" as="image" href="/user-intro@2x.png" />
      <link rel="preload" as="image" href="/user-convo@2x.png" />
      
      <DialogueProvider>
        <DialogueStageManager />
      </DialogueProvider>
    </main>
  );
}
