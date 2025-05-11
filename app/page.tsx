"use client";

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
      return <ConversationScreen />;
    case "synthesis":
      return <SynthesisView />;
    default:
      return <WelcomeScreen />;
  }
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
