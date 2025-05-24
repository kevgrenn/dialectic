"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDialogue } from "@/lib/context/DialogueContext";
import { generatePerspectiveResponse, generateSynthesis } from "@/lib/api/openai";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';

// Message types for the chat
type MessageType = 'user' | 'supporter' | 'critic' | 'converse-request' | 'summary';

interface ChatMessage {
  type: MessageType;
  content: string;
  timestamp: number;
}

const ConversationLayout: React.FC = () => {
  const { state, dispatch } = useDialogue();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Combine all messages into a single chat timeline
  const chatMessages: ChatMessage[] = React.useMemo(() => {
    const messages: ChatMessage[] = [];
    
    // Interleave messages based on their order
    const maxLength = Math.max(
      state.userMessages.length,
      state.perspectiveA.messages.length,
      state.perspectiveB.messages.length
    );

    for (let i = 0; i < maxLength; i++) {
      // Add user message first
      if (i < state.userMessages.length) {
        messages.push({
          type: 'user',
          content: state.userMessages[i],
          timestamp: Date.now() + i * 3
        });
      }
      
      // Add supporter response
      if (i < state.perspectiveA.messages.length) {
        messages.push({
          type: 'supporter',
          content: state.perspectiveA.messages[i],
          timestamp: Date.now() + i * 3 + 1
        });
      }
      
      // Add critic response
      if (i < state.perspectiveB.messages.length) {
        messages.push({
          type: 'critic',
          content: state.perspectiveB.messages[i],
          timestamp: Date.now() + i * 3 + 2
        });
      }
    }

    // Add synthesis as summary message at the end if it exists
    if (state.synthesis) {
      messages.push({
        type: 'summary',
        content: state.synthesis,
        timestamp: Date.now() + maxLength * 3
      });
    }

    return messages;
  }, [state.userMessages, state.perspectiveA.messages, state.perspectiveB.messages, state.synthesis]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [chatMessages, state.streamingResponseA, state.streamingResponseB, state.streamingSynthesis]);

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
      
      // Generate supporter response
      let streamingResponseA = '';
      const responseA = await generatePerspectiveResponse(
        'supportive', 
        message, 
        conversationHistory,
        (chunk) => {
          streamingResponseA += chunk;
          dispatch({ 
            type: "SET_STREAMING_RESPONSE_A", 
            payload: streamingResponseA
          });
        }
      );
      dispatch({ type: "ADD_PERSPECTIVE_A_MESSAGE", payload: responseA });
      
      // Generate critic response
      dispatch({ type: "CLEAR_STREAMING_RESPONSES" });
      let streamingResponseB = '';
      const responseB = await generatePerspectiveResponse(
        'critical', 
        message, 
        conversationHistory,
        (chunk) => {
          streamingResponseB += chunk;
          dispatch({ 
            type: "SET_STREAMING_RESPONSE_B", 
            payload: streamingResponseB
          });
        }
      );
      dispatch({ type: "ADD_PERSPECTIVE_B_MESSAGE", payload: responseB });
      
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

  // Handle converse mode - AI perspectives talk to each other
  const handleConverse = async (): Promise<void> => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    dispatch({ type: "START_PROCESSING" });
    
    try {
      // Add a system message indicating converse mode was requested
      dispatch({ type: "ADD_USER_MESSAGE", payload: "You asked the supporter and critic to converse with each other]" });
      
      // Prepare conversation history
      const conversationHistory = [
        ...state.userMessages.map((msg, i) => `User (${i+1}): ${msg}`),
        ...state.perspectiveA.messages.map((msg, i) => `Supporter (${i+1}): ${msg}`),
        ...state.perspectiveB.messages.map((msg, i) => `Critic (${i+1}): ${msg}`),
      ];
      
      // Clear streaming responses
      dispatch({ type: "CLEAR_STREAMING_RESPONSES" });
      
      // Supporter responds to critic's last message
      const lastCriticMessage = state.perspectiveB.messages[state.perspectiveB.messages.length - 1] || "Please share your perspective.";
      let streamingResponseA = '';
      const responseA = await generatePerspectiveResponse(
        'supportive', 
        `Please respond to and comment on this perspective: "${lastCriticMessage}"`, 
        conversationHistory,
        (chunk) => {
          streamingResponseA += chunk;
          dispatch({ 
            type: "SET_STREAMING_RESPONSE_A", 
            payload: streamingResponseA
          });
        }
      );
      dispatch({ type: "ADD_PERSPECTIVE_A_MESSAGE", payload: responseA });
      
      // Critic responds to supporter's response
      dispatch({ type: "CLEAR_STREAMING_RESPONSES" });
      let streamingResponseB = '';
      const responseB = await generatePerspectiveResponse(
        'critical', 
        `Please respond to and comment on this perspective: "${responseA}"`, 
        [...conversationHistory, `Supporter: ${responseA}`],
        (chunk) => {
          streamingResponseB += chunk;
          dispatch({ 
            type: "SET_STREAMING_RESPONSE_B", 
            payload: streamingResponseB
          });
        }
      );
      dispatch({ type: "ADD_PERSPECTIVE_B_MESSAGE", payload: responseB });
      
    } catch (error) {
      console.error("Error generating converse responses:", error);
      toast.error("Failed to generate AI conversation. Please check your API key and try again.");
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to generate AI conversation. Please check your API key and try again.",
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
    if (isSubmitting) return;

    setIsSubmitting(true);
    dispatch({ type: "START_PROCESSING" });
    dispatch({ type: "CLEAR_STREAMING_SYNTHESIS" });
    
    try {
      const synthesis = await generateSynthesis(
        state.userMessages,
        state.perspectiveA.messages,
        state.perspectiveB.messages,
        (chunk) => {
          dispatch({ type: "UPDATE_STREAMING_SYNTHESIS", payload: chunk });
        }
      );
      
      // Add synthesis as an inline message instead of navigating to synthesis page
      dispatch({ type: "ADD_USER_MESSAGE", payload: "You asked for a discussion summary" });
      dispatch({ type: "SET_SYNTHESIS", payload: synthesis });
      toast.success("Summary generated successfully!");
    } catch (error) {
      console.error("Error generating synthesis:", error);
      toast.error("Failed to generate summary. Please check your API key and try again.");
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to generate summary. Please check your API key and try again.",
      });
    } finally {
      setIsSubmitting(false);
      dispatch({ type: "STOP_PROCESSING" });
    }
  };

  // Render a chat message bubble
  const renderMessage = (msg: ChatMessage, index: number) => {
    const isUser = msg.type === 'user';
    const isSupporter = msg.type === 'supporter';
    const isSummary = msg.type === 'summary';
    
    if (isUser) {
      return (
        <div key={index} className="flex justify-end mb-6">
          <div className="max-w-[70%] bg-[#FDF16A] text-black rounded-xl px-4 py-3 shadow-sm">
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {msg.content}
            </div>
          </div>
        </div>
      );
    }

    if (isSummary) {
      return (
        <div key={index} className="flex justify-center mb-6 pl-[50px]">
          <div className="w-full bg-white rounded-xl px-4 py-3 shadow-sm border-0" style={{ boxShadow: "var(--card-shadow)" }}>
            {/* Summary header */}
            <div className="mb-2">
              <h4 className="text-[16px] font-[400] font-heading text-[#3d3d3d] mb-0">
                Discussion Summary
              </h4>
            </div>
            
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({...props}) => <h1 className="text-md font-bold" {...props} />,
                  h2: ({...props}) => <h2 className="text-base font-bold" {...props} />,
                  h3: ({...props}) => <h3 className="text-sm font-bold" {...props} />,
                  p: ({...props}) => <p className="my-2 text-sm leading-relaxed text-[#3d3d3d]" {...props} />,
                  ul: ({...props}) => <ul className="list-disc text-sm pl-4 my-2" {...props} />,
                  ol: ({...props}) => <ol className="list-decimal text-sm pl-4 my-2" {...props} />,
                  li: ({...props}) => <li className="my-1 text-sm leading-relaxed" {...props} />
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={index} className="flex items-end mb-6">
        {/* Avatar positioned to the left, aligned to bottom */}
        <div className="mr-3 mb-1 ml-[10px] flex-shrink-0">
          <Image 
            src={isSupporter ? "/supporter-convo@2x.png" : "/critic-convo@2x.png"}
            alt={isSupporter ? "Supporter" : "Critic"}
            width={40}
            height={40}
            className="rounded-full"
          />
        </div>
        
        <div className="flex flex-col items-start max-w-[460px]">
          {/* Card-style message bubble */}
          <div className="relative bg-white rounded-t-xl rounded-br-xl px-4 py-3 shadow-sm border-0" style={{ boxShadow: "var(--card-shadow)" }}>
            {/* Speech bubble tail */}
            <div className="absolute bottom-3 left-[-8px] w-0 h-0 border-b-[12px] border-l-[12px] border-b-white border-l-transparent transform translate-y-full -translate-x-1"></div>
            
            {/* Message header */}
            <div className="mb-2">
              <h4 className="text-[16px] font-[400] font-heading text-[#3d3d3d] mb-0">
                {isSupporter ? 'Supporter' : 'Critic'}
              </h4>
              <p className="text-[12px] leading-[16px] text-[#777777]">
                {isSupporter ? 'Affirms and extends core ideas' : 'Pokes holes with wit and sarcasm'}
              </p>
            </div>
            
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({...props}) => <h1 className="text-md font-bold" {...props} />,
                  h2: ({...props}) => <h2 className="text-base font-bold" {...props} />,
                  h3: ({...props}) => <h3 className="text-sm font-bold" {...props} />,
                  p: ({...props}) => <p className="my-2 text-sm leading-relaxed text-[#3d3d3d]" {...props} />,
                  ul: ({...props}) => <ul className="list-disc text-sm pl-4 my-2" {...props} />,
                  ol: ({...props}) => <ol className="list-decimal text-sm pl-4 my-2" {...props} />,
                  li: ({...props}) => <li className="my-1 text-sm leading-relaxed" {...props} />
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render streaming message
  const renderStreamingMessage = (type: 'supporter' | 'critic', content: string) => {
    if (!content) return null;
    
    const isSupporter = type === 'supporter';
    
    return (
      <div className="flex items-end mb-6">
        {/* Avatar positioned to the left, aligned to bottom */}
        <div className="mr-3 mb-1 ml-[10px] flex-shrink-0">
          <Image 
            src={isSupporter ? "/supporter-convo@2x.png" : "/critic-convo@2x.png"}
            alt={isSupporter ? "Supporter" : "Critic"}
            width={40}
            height={40}
            className="rounded-full"
          />
        </div>
        
        <div className="flex flex-col items-start max-w-[460px]">
          {/* Card-style message bubble */}
          <div className="relative bg-white rounded-t-lg rounded-b-none px-4 py-3 shadow-sm border-0" style={{ boxShadow: "var(--card-shadow)" }}>
            {/* Speech bubble tail */}
            <div className="absolute bottom-0 left-0 w-0 h-0 border-t-[12px] border-r-[12px] border-t-white border-r-transparent transform translate-y-full -translate-x-1"></div>
            
            {/* Message header */}
            <div className="mb-2">
              <h4 className="text-[16px] font-[400] font-heading text-[#3d3d3d] mb-1">
                {isSupporter ? 'Supporter' : 'Critic'}
              </h4>
              <p className="text-[12px] leading-[16px] text-[#777777]">
                {isSupporter ? 'Affirms and extends core ideas' : 'Pokes holes with wit and sarcasm'}
              </p>
            </div>
            
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({...props}) => <h1 className="text-md font-bold" {...props} />,
                  h2: ({...props}) => <h2 className="text-base font-bold" {...props} />,
                  h3: ({...props}) => <h3 className="text-sm font-bold" {...props} />,
                  p: ({...props}) => <p className="my-2 text-sm leading-relaxed text-[#3d3d3d]" {...props} />,
                  ul: ({...props}) => <ul className="list-disc text-sm pl-4 my-2" {...props} />,
                  ol: ({...props}) => <ol className="list-decimal text-sm pl-4 my-2" {...props} />,
                  li: ({...props}) => <li className="my-1 text-sm leading-relaxed" {...props} />
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render streaming synthesis
  const renderStreamingSynthesis = (content: string) => {
    if (!content) return null;
    
    return (
      <div className="flex justify-center mb-6 pl-[50px]">
        <div className="w-full bg-white rounded-xl px-4 py-3 shadow-sm border-0" style={{ boxShadow: "var(--card-shadow)" }}>
          {/* Summary header */}
          <div className="mb-2">
            <h4 className="text-[16px] font-[400] font-heading text-[#3d3d3d] mb-0">
              Discussion Summary
            </h4>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                h1: ({...props}) => <h1 className="text-md font-bold" {...props} />,
                h2: ({...props}) => <h2 className="text-base font-bold" {...props} />,
                h3: ({...props}) => <h3 className="text-sm font-bold" {...props} />,
                p: ({...props}) => <p className="my-2 text-sm leading-relaxed text-[#3d3d3d]" {...props} />,
                ul: ({...props}) => <ul className="list-disc text-sm pl-4 my-2" {...props} />,
                ol: ({...props}) => <ol className="list-decimal text-sm pl-4 my-2" {...props} />,
                li: ({...props}) => <li className="my-1 text-sm leading-relaxed" {...props} />
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-background relative">
      {/* Desktop: User icon and logo positioned in top left (hidden below 1200px) */}
      <div className="absolute top-[36px] left-[36px] z-10 flex items-center">
        <Image 
          src="/user-intro@2x.png" 
          alt="User" 
          width={56} 
          height={56}
          className="hidden lg:block cursor-pointer"
          onClick={() => {
            dispatch({ type: "RESET" });
            dispatch({ type: "SET_STAGE", payload: "welcome" });
          }}
        />
        <Image 
          src="/Dialectic@2x.png" 
          alt="Dialectic" 
          width={88} 
          height={25}
          className="ml-3 hidden xl:block cursor-pointer"
          onClick={() => {
            dispatch({ type: "RESET" });
            dispatch({ type: "SET_STAGE", payload: "welcome" });
          }}
        />
      </div>

      {/* Mobile header (shown below 1000px) */}
      <div className="lg:hidden w-full h-[60px] bg-background flex items-center justify-center z-20" style={{ boxShadow: "var(--card-shadow)" }}>
        <div className="flex items-center cursor-pointer" onClick={() => {
          dispatch({ type: "RESET" });
          dispatch({ type: "SET_STAGE", payload: "welcome" });
        }}>
          <Image 
            src="/user-intro@2x.png" 
            alt="User" 
            width={36} 
            height={36}
          />
          <Image 
            src="/Dialectic@2x.png" 
            alt="Dialectic" 
            width={66} 
            height={24}
            className="ml-2"
          />
        </div>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-hidden relative lg:pt-0 pt-0">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="pt-6 pb-4 pr-[10px] sm:pr-[50px] space-y-4 max-w-[780px] mx-auto">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>Start the conversation by typing a message below...</p>
              </div>
            ) : (
              <>
                {chatMessages.map((msg, index) => renderMessage(msg, index))}
                
                {/* Render streaming messages */}
                {state.streamingResponseA && renderStreamingMessage('supporter', state.streamingResponseA)}
                {state.streamingResponseB && renderStreamingMessage('critic', state.streamingResponseB)}
                {state.streamingSynthesis && renderStreamingSynthesis(state.streamingSynthesis)}
              </>
            )}
          </div>
        </ScrollArea>
        
        {/* Fade out gradient at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[40px] bg-gradient-to-t from-background to-transparent pointer-events-none z-10"></div>
      </div>

      {/* Input area */}
      <div className="mb-0 px-0 w-full lg:px-[50px] lg:w-[780px] lg:mx-auto">
        <div className="bg-white rounded-t-none lg:rounded-t-xl rounded-b-none p-4" style={{ boxShadow: "var(--card-shadow)" }}>
          {/* Top row: Text area and submit button */}
          <div className="flex items-end space-x-3 mb-3">
            <div className="flex-1">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What's your response?"
                className="min-h-[60px] max-h-[120px] resize-none border-0 text-base placeholder:text-[#848484] bg-white"
                disabled={isSubmitting || state.isProcessing}
              />
            </div>
            
            {/* Send button */}
            <Button 
              onClick={() => void handleUserMessage(message)}
              disabled={!message.trim() || isSubmitting || state.isProcessing}
              className="px-2 py-2 min-h-[60px] max-h-[120px] bg-[#FDF16A] hover:bg-[#EFE032]"
            >
              <Image 
                src="/arrow-right-bold.svg"
                alt="Send"
                width={20}
                height={20}
              />
            </Button>
          </div>
          
          {/* Bottom row: Converse and Summarize buttons on the left */}
          {chatMessages.length > 0 && (
            <div className="flex items-center space-x-1">
              {/* Converse button */}
              <Button 
                onClick={handleConverse}
                disabled={isSubmitting || state.isProcessing}
                variant="ghost"
                className="px-3 py-2 text-sm font-heading font-medium text-gray-500"
                title="Let AI perspectives converse with each other"
              >
                <Image 
                  src="/shuffle-bold.svg"
                  alt="Converse"
                  width={20}
                  height={20}
                  className="mr-0 opacity-50"
                />
                Converse
              </Button>
              
              {/* Summarize button */}
              <Button
                onClick={handleGenerateSynthesis}
                disabled={isSubmitting || state.isProcessing}
                variant="ghost"
                className="px-3 py-2 text-sm font-heading text-gray-500"
                title="Generate synthesis"
              >
                <Image 
                  src="/note-blank-bold.svg"
                  alt="Summarize"
                  width={20}
                  height={20}
                  className="mr-0 opacity-50"
                />
                Summarize
              </Button>
            </div>
          )}
        </div>
      </div>

      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mx-4 mb-4 rounded max-w-[730px] mx-auto">
          {state.error}
        </div>
      )}
    </div>
  );
};

export default ConversationLayout; 