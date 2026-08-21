"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Loader2 } from "lucide-react"

type Props = {
    /** Arka planda yenileme sürüyor mu (ilk yükleme DEĞİL — o skeleton'a ait). */
    isVisible: boolean
    label?: string
}

/**
 * Bölüm-yerel yenileme göstergesi (AGENTS.md'deki refetch-feedback deseni).
 *
 * Kullanımı: `relative` bir sarmalayıcı + bu bileşen. İçerik ekranda KALIR, üstüne
 * hafif bir katman biner; sayfa seviyesinde bloklayıcı spinner kullanılmaz.
 * `pointer-events-none` sayesinde altındaki tabloyla etkileşim kesilmez.
 */
export function AdminSectionLoadingOverlay({ isVisible, label = "Yenileniyor…" }: Props) {
    const shouldReduceMotion = useReducedMotion()

    return (
        <AnimatePresence>
            {isVisible ? (
                <motion.div
                    role="status"
                    aria-live="polite"
                    className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center rounded-md bg-white/60 pt-6 backdrop-blur-[1px] dark:bg-neutral-950/60"
                    initial={shouldReduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
                >
                    <span className="flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-medium shadow-sm dark:bg-neutral-900">
                        <Loader2 className="size-3.5 animate-spin" />
                        {label}
                    </span>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}
