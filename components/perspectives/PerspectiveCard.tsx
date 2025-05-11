"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw } from "lucide-react";

interface PerspectiveCardProps {
  name: string;
  description: string;
  messages: string[];
  avatarLetter: string;
  avatarColor: string;
  isSpeaking: boolean;
  isLoading?: boolean;
}

const PerspectiveCard: React.FC<PerspectiveCardProps> = ({
  name,
  description,
  messages,
  avatarLetter,
  avatarColor,
  isSpeaking,
  isLoading = false,
}) => {
  return (
    <Card 
      className={`h-full flex flex-col rounded-lg bg-white border-0 w-full ${
        isSpeaking ? "ring-2 ring-primary/50" : ""
      }`}
      style={{ 
        boxShadow: "0px 1px 4px 0px rgba(12, 12, 13, 0.05)" 
      }}
    >
      <CardHeader className="pb-1">
        <div className="flex items-center gap-1">
          <div>
            <CardTitle className="text-[18px] leading-[24px] tracking-[-0.01em] font-[400] font-heading text-[#3d3d3d]">{name}</CardTitle>
            <CardDescription className="text-[12px] leading-[16px] text-[#777777]">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-1">
          <div className="space-y-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground text-sm">Generating response...</p>
              </div>
            ) : messages.length === 0 ? (
              <p className="text-muted-foreground italic text-center">
                Waiting for conversation to begin...
              </p>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className="p-0 rounded-md text-sm leading-relaxed"
                >
                  {message}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PerspectiveCard; 