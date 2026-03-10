"use client"

import { ReactNode, useState } from "react";
import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false },
            mutations: { retry: 0 }
        },
    }));
    return (
        <SessionProvider>
            <QueryClientProvider client={queryClient}>
                {children}
                <ReactQueryDevtools initialIsOpen={true} />
            </QueryClientProvider>
        </SessionProvider>
    )
}
