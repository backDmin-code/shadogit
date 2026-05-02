"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange={false}
      >
        <TooltipProvider delayDuration={250}>
          {children}
          <Toaster
            theme="system"
            richColors
            position="bottom-right"
            toastOptions={{
              className:
                "rounded-2xl border bg-surface/95 backdrop-blur-xl text-foreground",
            }}
          />
        </TooltipProvider>
      </NextThemesProvider>
    </SessionProvider>
  );
}
