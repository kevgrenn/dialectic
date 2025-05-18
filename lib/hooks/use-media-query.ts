"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to check if a media query matches the current viewport
 * @param query Media query string (e.g., "(max-width: 768px)")
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    // On the server or very old browsers, always return false
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
      return;
    }
    
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);
    
    // Add listener for changes to the media query
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add listener for resize events
    mediaQuery.addEventListener("change", listener);
    
    // Clean up the listener when component unmounts
    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  }, [query]);
  
  return matches;
} 