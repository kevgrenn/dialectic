import "@/app/globals.css";
import type { Metadata } from "next";
import { Lexend_Deca, Noto_Serif } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import HeaderWrapper from "@/components/layouts/HeaderWrapper";
import Image from "next/image";

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
        
        {/* Fixed background squiggle image */}
        <div className="fixed bottom-[500px] left-1/2 transform -translate-x-1/2 w-full pointer-events-none z-[-1]">
          <Image 
            src="/squiggle@2x.png"
            alt="Background decoration"
            width={1526}
            height={100}
            className="mx-auto"
            priority
          />
        </div>
      </body>
    </html>
  );
}
