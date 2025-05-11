"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDialogue } from "@/lib/context/DialogueContext";
import { Download, RefreshCw } from "lucide-react";
import ReactMarkdown from 'react-markdown';

const SynthesisView: React.FC = () => {
  const { state, dispatch } = useDialogue();

  const handleExport = () => {
    if (!state.synthesis) return;

    // Create a blob with the synthesis content
    const blob = new Blob([state.synthesis], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    
    // Create a link and trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = "dialectic-synthesis.md";
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleNewSession = () => {
    dispatch({ type: "RESET" });
    dispatch({ type: "SET_STAGE", payload: "welcome" });
  };

  return (
    <div className="w-full mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Dialectical Synthesis</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Synthesis of the Dialectical Process</CardTitle>
        </CardHeader>
        <CardContent>
          {state.isProcessing ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : state.synthesis ? (
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <ReactMarkdown>{state.synthesis}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-muted-foreground italic text-center">
              No synthesis available. Please return to the conversation and generate one.
            </p>
          )}
        </CardContent>
      </Card>
      
      <div className="flex flex-wrap gap-4 justify-center">
        <Button
          onClick={handleExport}
          className="gap-2"
          disabled={!state.synthesis || state.isProcessing}
        >
          <Download className="h-4 w-4" />
          Export as Markdown
        </Button>
        
        <Button 
          variant="outline"
          onClick={handleNewSession}
          disabled={state.isProcessing}
        >
          Start New Session
        </Button>
      </div>
    </div>
  );
};

export default SynthesisView; 