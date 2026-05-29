"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { LoadingProvider } from "@/components/providers/loading-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <LoadingProvider>
          {children}
          <Toaster />
        </LoadingProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
