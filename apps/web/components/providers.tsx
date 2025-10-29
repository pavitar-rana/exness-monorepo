"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/themes/theme-provider";
import { ReactNode } from "react";
import { Session } from "next-auth";

export function Providers({
  children,
  session,
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
