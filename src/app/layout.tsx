import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import "highlight.js/styles/github-dark.css";
import {
  DM_Sans,
  DM_Serif_Display,
  JetBrains_Mono,
} from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-heading",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Knowledge - Share ideas that matter",
    template: "%s | Knowledge",
  },
  description:
    "A community-driven platform for sharing knowledge, insights, and ideas that matter.",
  openGraph: {
    title: "Knowledge - Share ideas that matter",
    description:
      "A community-driven platform for sharing knowledge, insights, and ideas that matter.",
    siteName: "Knowledge",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${dmSerifDisplay.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-background font-body antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:inline-flex focus:h-10 focus:items-center focus:rounded-lg focus:bg-background focus:px-4 focus:text-sm focus:font-medium focus:shadow-md focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
