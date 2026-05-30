import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import "highlight.js/styles/github-dark.css";
import {
  Be_Vietnam_Pro,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
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
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
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
      className={`${beVietnamPro.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
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
