import "@/app/globals.css";
import type { Metadata } from "next";
import { Lexend_Deca, Noto_Serif } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import HeaderWrapper from "@/components/layouts/HeaderWrapper";

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  variable: "--font-lexend-deca",
});

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  variable: "--font-noto-serif",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Dialectic | Structured Thinking Through Conversation",
  description: "Improve understanding and thinking through structured dialectical conversations between you and AI perspectives.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${lexendDeca.variable} ${notoSerif.variable}`}>
        <HeaderWrapper />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
