"use client";

import { DialogueProvider, useDialogue } from "@/lib/context/DialogueContext";
import WelcomeScreen from "@/components/layouts/WelcomeScreen";
import ConversationScreen from "@/components/layouts/ConversationLayout";
import SynthesisView from "@/components/synthesis/SynthesisView";
import { AnimatePresence, motion } from "framer-motion";

// Main component that conditionally renders based on the current stage
const DialogueStageManager = () => {
  const { state } = useDialogue();

  // Render different components based on the current stage
  return (
    <AnimatePresence mode="wait">
      {state.stage === "welcome" && (
        <motion.div
          key="welcome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          <WelcomeScreen />
        </motion.div>
      )}
      
      {state.stage === "conversation" && (
        <motion.div
          key="conversation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          <ConversationScreen />
        </motion.div>
      )}
      
      {state.stage === "synthesis" && (
        <motion.div
          key="synthesis"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          <SynthesisView />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Root page component wrapped with DialogueProvider for state management
export default function Home() {
  return (
    <main className="min-h-screen">
      <DialogueProvider>
        <DialogueStageManager />
      </DialogueProvider>
    </main>
  );
}
