"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export function MainShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
