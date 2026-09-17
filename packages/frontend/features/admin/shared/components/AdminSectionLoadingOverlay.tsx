"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Loader2 } from "lucide-react"

type Props = {
    /** Arka planda yenileme sürüyor mu (ilk yükleme DEĞİL — o skeleton'a ait). */
    isVisible: boolean
    label?: string
    /** İkinci satır — verilirse kartın altında gösterilir. */
    description?: string
}

/**
 * Bölüm-yerel yenileme göstergesi (AGENTS.md'deki refetch-feedback deseni).
 *
 * Kullanımı: `relative` bir sarmalayıcı + bu bileşen. İçerik ekranda KALIR, üstüne
 * hafif bir katman biner; sayfa seviyesinde bloklayıcı spinner kullanılmaz.
 * `pointer-events-none` sayesinde altındaki tabloyla etkileşim kesilmez.
 *
 * Görsel dil `CustomerPortalProductsLoadingOverlay`'in (müşteri portalı ürün
 * ızgarası) cam-kart + marka renkli ikon dairesinden alınır — kullanıcı
 * talebiyle satış paneli genelinde AYNI görünüm; ürün-ızgarasına özel iskelet
 * kartları BİLEREK yok, çünkü bu bileşen tablo/kart/harita gibi HER liste
 * şeklinde kullanılıyor.
 */
export function AdminSectionLoadingOverlay({ isVisible, label = "Yenileniyor…", description }: Props) {
    const shouldReduceMotion = useReducedMotion()

    return (
        <AnimatePresence>
            {isVisible ? (
                <motion.div
                    role="status"
                    aria-live="polite"
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-md bg-white/55 backdrop-blur-[1.5px] dark:bg-neutral-950/60"
                    initial={shouldReduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
                >
                    <div className="flex w-full max-w-xs flex-col items-center rounded-3xl border border-white/80 bg-white/90 px-5 py-5 text-center shadow-[0_20px_44px_-28px_rgba(15,23,42,0.3)] dark:border-neutral-800 dark:bg-neutral-900/90">
                        <div className="mb-3 inline-flex size-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{label}</p>
                        {description ? (
                            <p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                                {description}
                            </p>
                        ) : null}
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}
