import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
