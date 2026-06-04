"use client"

import { motion } from "motion/react"
import { Loader2 } from "lucide-react"

export function CustomerPortalProductsLoadingOverlay({
    label = "Ürünler güncelleniyor",
    description = "Liste yeni seçiminize göre hazırlanıyor.",
}: {
    label?: string
    description?: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 z-10 rounded-[24px] bg-white/55 backdrop-blur-[1.5px]"
            aria-hidden="true"
        >
            <div className="flex h-full flex-col justify-between p-4 sm:p-5">
                <div className="flex justify-end">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-sm">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
                        {label}
                    </div>
                </div>

                <div className="mx-auto flex w-full max-w-md flex-col items-center rounded-[24px] border border-white/80 bg-white/88 px-5 py-5 text-center shadow-[0_20px_44px_-28px_rgba(15,23,42,0.3)]">
                    <div className="mb-3 inline-flex size-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                    <p className="text-sm font-semibold text-neutral-900">
                        {label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                        {description}
                    </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <motion.div
                            key={index}
                            className="overflow-hidden rounded-[24px] border border-white/80 bg-white/80 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)]"
                            initial={{ opacity: 0.35, y: 8 }}
                            animate={{ opacity: [0.35, 0.68, 0.35], y: [8, 0, 8] }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: index * 0.08,
                            }}
                        >
                            <div className="aspect-[4/3] bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-100" />
                            <div className="space-y-3 p-4">
                                <div className="h-4 w-4/5 rounded-full bg-neutral-200" />
                                <div className="h-3 w-2/3 rounded-full bg-neutral-100" />
                                <div className="h-8 w-24 rounded-full bg-neutral-100" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}
