"use client"

import { motion } from "motion/react"
import { Loader2 } from "lucide-react"

type ProductVariantNavigationOverlayProps = {
    measurementLabel?: string
}

export default function ProductVariantNavigationOverlay({
    measurementLabel,
}: ProductVariantNavigationOverlayProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 z-20 rounded-2xl bg-white/62 backdrop-blur-[1.5px]"
            aria-hidden="true"
        >
            <div className="flex h-full flex-col justify-between p-4 sm:p-5">
                <div className="flex justify-end">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/92 px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-sm">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
                        Varyantlar açılıyor
                    </div>
                </div>

                <div className="mx-auto flex w-full max-w-md flex-col items-center rounded-[24px] border border-white/80 bg-white/90 px-5 py-5 text-center shadow-[0_20px_44px_-28px_rgba(15,23,42,0.3)]">
                    <div className="mb-3 inline-flex size-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                    <p className="text-sm font-semibold text-neutral-900">
                        Varyant detayları hazırlanıyor
                    </p>
                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                        {measurementLabel
                            ? `${measurementLabel} ölçüsüne ait varyantlar açılıyor.`
                            : "Seçilen ölçüye ait varyantlar açılıyor."}
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <motion.div
                            key={index}
                            className="rounded-[20px] border border-white/80 bg-white/80 p-4 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.28)]"
                            initial={{ opacity: 0.32, y: 10 }}
                            animate={{ opacity: [0.32, 0.64, 0.32], y: [10, 0, 10] }}
                            transition={{
                                duration: 1.35,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: index * 0.08,
                            }}
                        >
                            <div className="h-3 w-2/3 rounded-full bg-neutral-200" />
                            <div className="mt-3 h-10 rounded-2xl bg-neutral-100" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}
