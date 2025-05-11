import "@/app/globals.css";
import type { Metadata } from "next";
import { Lexend_Deca, Noto_Serif } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/layouts/Header";

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
        <Header />
        <div className="max-w-[1200px] mx-auto px-4">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
