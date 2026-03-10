"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function HomeToasts({ error }: { error?: string }) {
    const handledRef = useRef(false);

    useEffect(() => {
        if (handledRef.current) return;

        if (error === "admin-only") {
            handledRef.current = true;

            setTimeout(() => {
                toast.error("Sadece admin kullanıcıları bu sayfaya erişebilir.", {
                    duration: 3000,
                    position: "top-center",
                    richColors: true,
                });
            }, 100);

            // query paramı sessizce kaldır
            const url = new URL(window.location.href);
            url.searchParams.delete("error");
            window.history.replaceState({}, "", url.toString());
        }
    }, [error]);

    return null;
}