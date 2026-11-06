import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";

import { NavigationFeedback } from "@/components/app-shell/navigation-feedback";
import "./globals.css";

export const metadata: Metadata = {
  title: "Astral Impact Hub",
  description: "Impact operations, content intelligence, and publishing platform."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <NavigationFeedback />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
