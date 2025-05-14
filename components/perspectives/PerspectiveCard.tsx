"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from "framer-motion";

interface PerspectiveCardProps {
  name: string;
  description: string;
  messages: string[];
  streamingMessage?: string;
  avatarLetter?: string;
  avatarColor?: string;
  isSpeaking: boolean;
  isLoading?: boolean;
}

const PerspectiveCard: React.FC<PerspectiveCardProps> = ({
  name,
  description,
  messages,
  streamingMessage = "",
  isSpeaking,
  isLoading = false,
}) => {
  // Ensure we scroll to bottom when streaming new content
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const streamingContentRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    if (streamingMessage && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [streamingMessage]);

  // Process streaming message to preserve line breaks
  const processedStreamingMessage = React.useMemo(() => {
    if (!streamingMessage) return "";
    
    // Split by line breaks and join with proper HTML line breaks
    return streamingMessage
      .split('\n')
      .map((line, i) => <React.Fragment key={i}>{line}<br /></React.Fragment>);
  }, [streamingMessage]);

  // Animation variants
  const messageVariants = {
    hidden: { 
      opacity: 0,
      y: 10,
      scale: 0.95
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 3,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 2
      }
    }
  };

  return (
    <Card 
      className={`h-full flex flex-col rounded-lg bg-white border-0 w-full ${
        isSpeaking ? "ring-2 ring-primary/50" : ""
      }`}
      style={{ 
        boxShadow: "var(--card-shadow)" 
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
        <ScrollArea className="h-full pr-1" ref={scrollAreaRef}>
          <div className="space-y-4">
            {isLoading ? (
              <motion.div 
                className="flex flex-col items-center justify-center h-32 gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 3 }}
              >
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground text-sm">Generating response...</p>
              </motion.div>
            ) : messages.length === 0 && !streamingMessage ? (
              <motion.p 
                className="text-muted-foreground italic text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 3 }}
              >
                Waiting for conversation to begin...
              </motion.p>
            ) : (
              <>
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      className="prose prose-sm max-w-none"
                      variants={messageVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ delay: index * 1 }}
                    >
                      <ReactMarkdown
                        components={{
                          h1: ({...props}) => <h1 className="text-md font-bold" {...props} />,
                          h2: ({...props}) => <h2 className="text-base font-bold" {...props} />,
                          h3: ({...props}) => <h3 className="text-sm font-bold" {...props} />,
                          h4: ({...props}) => <h4 className="text-sm font-bold" {...props} />,
                          h5: ({...props}) => <h5 className="text-sm font-bold" {...props} />,
                          h6: ({...props}) => <h6 className="text-sm font-bold" {...props} />,
                          p: ({...props}) => <p className="my-2 text-sm leading-relaxed" {...props} />,
                          ul: ({...props}) => <ul className="list-disc text-sm pl-4 my-2" {...props} />,
                          ol: ({...props}) => <ol className="list-decimal text-sm pl-4 my-2" {...props} />,
                          li: ({...props}) => <li className="my-1 text-sm leading-relaxed" {...props} />
                        }}
                      >
                        {message}
                      </ReactMarkdown>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {streamingMessage && (
                  <motion.div 
                    className="prose prose-sm max-w-none p-2 rounded-md"
                    ref={streamingContentRef}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 3 }}
                  >
                    <div className="text-sm leading-relaxed">
                      {processedStreamingMessage}
                      {isSpeaking && <span className="animate-pulse">▌</span>}
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PerspectiveCard; 