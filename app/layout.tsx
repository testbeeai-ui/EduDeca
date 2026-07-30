import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { AmbientOrbs } from "@/components/common/ambient-orbs";

import "katex/dist/katex.min.css";
import "./globals.css";
import "./challenge-styles.css";

export const metadata: Metadata = {
  title: "EduDeca — Daily Learning, National Prestige",
  description:
    "Gamified learning for Class XI & XII. Build streaks, climb levels, compete nationally.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
          <SmoothScrollProvider>
            <AmbientOrbs />
            {children}
          </SmoothScrollProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
