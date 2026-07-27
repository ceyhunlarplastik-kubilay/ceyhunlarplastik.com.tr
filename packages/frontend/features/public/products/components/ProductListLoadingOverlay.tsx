"use client"

import { motion, useReducedMotion } from "motion/react"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

/**
 * Filtre/arama/sayfalama sonrası arka planda veri tazelenirken liste alanının ÜZERİNDE
 * gösterilen yerel geri bildirim.
 *
 * AGENTS.md kuralı: bu etkileşimlerde "tam sayfayı bloklayan spinner" YERİNE, etkilenen
 * bölüme yakın yerel geri bildirim; önceki içerik görünür kalsın; layout shift olmasın.
 * Bu yüzden overlay `absolute inset-0` ile YALNIZ liste kabına uygulanır ve altındaki
 * eski sonuçlar yarı saydam kalır (TanStack Query `placeholderData: (prev) => prev`
 * sayesinde içerik boşalmıyor).
 *
 * - `pointer-events-none`: mevcut içerik tıklanabilir kalır, akış bloklanmaz.
 * - `sticky`: uzun listede aşağı kaydırılmış olsa da rozet görünür kalır.
 * - `useReducedMotion`: hareket hassasiyeti olan kullanıcıda giriş animasyonu atlanır.
 */
export function ProductListLoadingOverlay() {
    const t = useTranslations("public.productFilter")
    const reduce = useReducedMotion()

    return (
        <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 z-10 rounded-2xl bg-white/60 backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
        >
            <div className="sticky top-28 flex justify-center pt-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200/80 bg-white/95 px-4 py-2 text-sm font-medium text-neutral-800 shadow-lg">
                    <Loader2 className="size-4 animate-spin text-brand" />
                    {t("updatingResults")}
                </span>
            </div>
        </motion.div>
    )
}
