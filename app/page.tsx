"use client";

import { DialogueProvider, useDialogue } from "@/lib/context/DialogueContext";
import WelcomeScreen from "@/components/layouts/WelcomeScreen";
import ConversationScreen from "@/components/layouts/ConversationLayout";
import SynthesisView from "@/components/synthesis/SynthesisView";
import React from "react";

// Main component that conditionally renders based on the current stage
const DialogueStageManager = () => {
  const { state } = useDialogue();

  // Render different components based on the current stage
  return (
    <>
      {state.stage === "welcome" && (
        <div className="w-full h-full relative z-10">
          <WelcomeScreen />
        </div>
      )}
      
      {state.stage === "conversation" && (
        <div className="w-full h-full relative z-10">
          <ConversationScreen />
        </div>
      )}
      
      {state.stage === "synthesis" && (
        <div className="w-full h-full relative z-10">
          <SynthesisView />
        </div>
      )}
    </>
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
