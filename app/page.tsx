"use client";

import { useEffect } from "react";
import { DialogueProvider, useDialogue } from "@/lib/context/DialogueContext";
import WelcomeScreen from "@/components/layouts/WelcomeScreen";
import ConversationScreen from "@/components/layouts/ConversationLayout";
import SynthesisView from "@/components/synthesis/SynthesisView";

// Main component that conditionally renders based on the current stage
const DialogueStageManager = () => {
  const { state } = useDialogue();

  // Render different components based on the current stage
  switch (state.stage) {
    case "welcome":
      return <WelcomeScreen />;
    case "conversation":
      return (
        <div className="container mx-auto py4">
          <ConversationScreen />
        </div>
      );
    case "synthesis":
      return (
        <div className="container mx-auto py-4">
          <SynthesisView />
        </div>
      );
    default:
      return <WelcomeScreen />;
  }
};

// Root page component wrapped with DialogueProvider for state management
export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-1">
      <DialogueProvider>
        <DialogueStageManager />
      </DialogueProvider>
    </main>
  );
}
