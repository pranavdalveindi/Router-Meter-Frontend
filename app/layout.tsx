import type { Metadata } from "next";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Indirex Router",
  description: "A professional network activity monitor and router data visualization dashboard.",
};

import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider defaultTheme="dark">
          {children}
          <Toaster richColors position="bottom-right" closeButton theme="dark" />
        </ThemeProvider>
      </body>
    </html>
  );
}
