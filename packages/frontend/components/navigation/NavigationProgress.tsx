"use client";

import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Spinner } from "@/components/ui/spinner";

/**
 * Navigasyon sırasında görünen global yükleniyor göstergesi.
 *
 * NEDEN GEREKLİ: App Router'da bir Link'e tıklandığında React, yeni sayfa hazır olana
 * kadar ESKİ ekranı göstermeye devam eder. `loading.tsx` iskeleti yalnız içerik alanında
 * çıkar — kullanıcı kategoriyi navbar'ın tam-ekran mega-dropdown'ından seçtiğinde iskelet
 * dropdown'ın ARKASINDA kaldığı için "tıkladım, hiçbir şey olmadı" hissi doğuyordu.
 * Bu bileşen navbar'ın (z-50) üstünde durur, bu yüzden her durumda görünür.
 *
 * TASARIM KARARI (AGENTS.md): tam ekranı bloklayan spinner YOK. Üstte ince ilerleme
 * çubuğu + küçük bir "Sayfa yükleniyor" rozeti — mevcut içerik görünür kalır.
 *
 * ÖNEMLİ: burada `useSearchParams()` KULLANILMAZ. Layout'ta render edildiği için
 * tüm public ağacı static'ten düşürür (bkz. kategori sayfası ISR regresyonu).
 * `usePathname` static generation'ı bozmaz.
 */
export function NavigationProgress() {
    const t = useTranslations("chrome.navigationProgress");
    const pathname = usePathname();
    const reduce = useReducedMotion();

    // Navigasyonun BAŞLADIĞI rota. Gösterge durumu bundan TÜRETİLİR: rota değiştiği anda
    // koşul kendiliğinden bozulur, yani "bitti" için effect içinde setState gerekmez
    // (effect içi senkron setState cascading render'a yol açar — lint de engelliyor).
    const [navFrom, setNavFrom] = useState<string | null>(null);
    const isNavigating = navFrom !== null && navFrom === pathname;

    // Navigasyon başlangıcı: iç linke yapılan gerçek tıklamayı yakala.
    // pathname'e bağlı: hem tıklama anındaki rotayı taze tutar hem de rota değişince
    // cleanup çalışıp güvenlik zamanlayıcısını temizler.
    useEffect(() => {
        let failsafe: number | null = null;

        const onClick = (event: MouseEvent) => {
            // Yeni sekme / indirme / modifier'lı tıklama navigasyon değildir.
            if (event.defaultPrevented) return;
            if (event.button !== 0) return;
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

            const anchor = (event.target as HTMLElement | null)?.closest?.("a");
            if (!anchor) return;
            if (anchor.hasAttribute("download")) return;
            if (anchor.target && anchor.target !== "_self") return;

            const href = anchor.getAttribute("href");
            if (!href || href.startsWith("#")) return;

            let url: URL;
            try {
                url = new URL(anchor.href, window.location.href);
            } catch {
                return;
            }

            // Dış link veya aynı sayfa (yalnız query/hash değişimi) → gösterge açma.
            if (url.origin !== window.location.origin) return;
            if (url.pathname === window.location.pathname) return;

            setNavFrom(pathname);

            // Güvenlik ağı: navigasyon iptal edilirse gösterge takılı kalmasın.
            if (failsafe !== null) window.clearTimeout(failsafe);
            failsafe = window.setTimeout(() => setNavFrom(null), 10000);
        };

        document.addEventListener("click", onClick, true);
        return () => {
            document.removeEventListener("click", onClick, true);
            if (failsafe !== null) window.clearTimeout(failsafe);
        };
    }, [pathname]);

    return (
        <AnimatePresence>
            {isNavigating ? (
                <>
                    {/* Üst ilerleme çubuğu — navbar'ın (z-50) üstünde */}
                    <motion.div
                        key="bar"
                        className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-brand"
                        initial={{ scaleX: 0, opacity: 1 }}
                        animate={{
                            scaleX: reduce ? 1 : 0.9,
                            transition: reduce
                                ? { duration: 0 }
                                : { duration: 8, ease: [0.22, 1, 0.36, 1] },
                        }}
                        exit={{ scaleX: 1, opacity: 0, transition: { duration: 0.2 } }}
                        aria-hidden="true"
                    />

                    {/* Yükleniyor rozeti — içerik görünür kalır, ekran bloklanmaz */}
                    <motion.div
                        key="badge"
                        className="fixed left-1/2 top-4 z-[60] -translate-x-1/2"
                        initial={reduce ? { opacity: 1 } : { opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        role="status"
                        aria-live="polite"
                    >
                        <div className="flex items-center gap-2 rounded-full border border-neutral-200/70 bg-white/90 px-4 py-2 text-sm font-medium text-neutral-800 shadow-lg backdrop-blur-sm">
                            <Spinner className="size-4 text-brand" />
                            {t("label")}
                        </div>
                    </motion.div>
                </>
            ) : null}
        </AnimatePresence>
    );
}
