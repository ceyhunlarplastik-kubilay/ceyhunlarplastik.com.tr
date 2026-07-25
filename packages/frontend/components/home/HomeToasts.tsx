"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export function HomeToasts() {
    const t = useTranslations("home.toasts");
    const handledRef = useRef(false);

    useEffect(() => {
        if (handledRef.current) return;

        // error param'ı doğrudan URL'den okunur; böylece sayfa server'da static kalır
        // (searchParams prop'u sayfayı dynamic'e düşürürdü).
        const url = new URL(window.location.href);
        const error = url.searchParams.get("error");

        if (error === "admin-only" || error === "unauthorized") {
            handledRef.current = true;

            setTimeout(() => {
                toast.error(t("accessDenied"), {
                    duration: 3000,
                    position: "top-center",
                    richColors: true,
                });
            }, 100);

            // query paramı sessizce kaldır
            url.searchParams.delete("error");
            window.history.replaceState({}, "", url.toString());
        }
    }, []);

    return null;
}
