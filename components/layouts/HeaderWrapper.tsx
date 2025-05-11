"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layouts/Header";

export default function HeaderWrapper() {
  const pathname = usePathname();
  
  // Don't show header on conversation page
  if (pathname === "/" || pathname.includes("/conversation")) {
    return null;
  }
  
  return <Header />;
} 