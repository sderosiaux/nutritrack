"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/query-client";

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // useState ensures each request gets its own QueryClient (SSR safety)
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
