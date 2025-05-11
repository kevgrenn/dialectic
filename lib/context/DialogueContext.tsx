"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";

type Stage = "welcome" | "conversation" | "synthesis";

type Perspective = {
  name: string;
  description: string;
  messages: string[];
};

type DialogueState = {
  stage: Stage;
  userInput: string;
  perspectiveA: Perspective;
  perspectiveB: Perspective;
  userMessages: string[];
  synthesis: string | null;
  isProcessing: boolean;
  error: string | null;
  streamingResponseA: string;
  streamingResponseB: string;
  streamingSynthesis: string;
};

type DialogueAction =
  | { type: "SET_STAGE"; payload: Stage }
  | { type: "SET_USER_INPUT"; payload: string }
  | { type: "SET_PERSPECTIVE_A"; payload: Perspective }
  | { type: "SET_PERSPECTIVE_B"; payload: Perspective }
  | { type: "ADD_USER_MESSAGE"; payload: string }
  | { type: "ADD_PERSPECTIVE_A_MESSAGE"; payload: string }
  | { type: "ADD_PERSPECTIVE_B_MESSAGE"; payload: string }
  | { type: "SET_SYNTHESIS"; payload: string }
  | { type: "START_PROCESSING" }
  | { type: "STOP_PROCESSING" }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "RESET" }
  | { type: "SET_STREAMING_RESPONSE_A"; payload: string }
  | { type: "SET_STREAMING_RESPONSE_B"; payload: string }
  | { type: "UPDATE_STREAMING_SYNTHESIS"; payload: string }
  | { type: "CLEAR_STREAMING_RESPONSES" }
  | { type: "CLEAR_STREAMING_SYNTHESIS" };

const initialState: DialogueState = {
  stage: "welcome",
  userInput: "",
  perspectiveA: {
    name: "",
    description: "",
    messages: [],
  },
  perspectiveB: {
    name: "",
    description: "",
    messages: [],
  },
  userMessages: [],
  synthesis: null,
  isProcessing: false,
  error: null,
  streamingResponseA: "",
  streamingResponseB: "",
  streamingSynthesis: "",
};

const dialogueReducer = (
  state: DialogueState,
  action: DialogueAction
): DialogueState => {
  switch (action.type) {
    case "SET_STAGE":
      return { ...state, stage: action.payload };
    case "SET_USER_INPUT":
      return { ...state, userInput: action.payload };
    case "SET_PERSPECTIVE_A":
      return { ...state, perspectiveA: action.payload };
    case "SET_PERSPECTIVE_B":
      return { ...state, perspectiveB: action.payload };
    case "ADD_USER_MESSAGE":
      return {
        ...state,
        userMessages: [...state.userMessages, action.payload],
      };
    case "ADD_PERSPECTIVE_A_MESSAGE":
      return {
        ...state,
        perspectiveA: {
          ...state.perspectiveA,
          messages: [...state.perspectiveA.messages, action.payload],
        },
        streamingResponseA: "", // Clear streaming response after adding complete message
      };
    case "ADD_PERSPECTIVE_B_MESSAGE":
      return {
        ...state,
        perspectiveB: {
          ...state.perspectiveB,
          messages: [...state.perspectiveB.messages, action.payload],
        },
        streamingResponseB: "", // Clear streaming response after adding complete message
      };
    case "SET_SYNTHESIS":
      return { 
        ...state, 
        synthesis: action.payload,
        streamingSynthesis: "", // Clear streaming synthesis after setting complete synthesis
      };
    case "START_PROCESSING":
      return { ...state, isProcessing: true };
    case "STOP_PROCESSING":
      return { ...state, isProcessing: false };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "SET_STREAMING_RESPONSE_A":
      return { ...state, streamingResponseA: action.payload };
    case "SET_STREAMING_RESPONSE_B":
      return { ...state, streamingResponseB: action.payload };
    case "UPDATE_STREAMING_SYNTHESIS":
      return { ...state, streamingSynthesis: state.streamingSynthesis + action.payload };
    case "CLEAR_STREAMING_RESPONSES":
      return { ...state, streamingResponseA: "", streamingResponseB: "" };
    case "CLEAR_STREAMING_SYNTHESIS":
      return { ...state, streamingSynthesis: "" };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

const DialogueContext = createContext<{
  state: DialogueState;
  dispatch: React.Dispatch<DialogueAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

export const DialogueProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(dialogueReducer, initialState);

  return (
    <DialogueContext.Provider value={{ state, dispatch }}>
      {children}
    </DialogueContext.Provider>
  );
};

export const useDialogue = () => useContext(DialogueContext); 