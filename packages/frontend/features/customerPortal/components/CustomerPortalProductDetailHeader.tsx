"use client"

import Link from "next/link"
import { useState, type MouseEvent } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

type CustomerPortalProductDetailHeaderProps = {
    categoryName?: string | null
    productName: string
    description: string
}

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
    return (
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.button !== 0
    )
}

export function CustomerPortalProductDetailHeader({
    categoryName,
    productName,
    description,
}: CustomerPortalProductDetailHeaderProps) {
    const [isNavigatingBack, setIsNavigatingBack] = useState(false)

    return (
        <div
            className="relative rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm"
            aria-busy={isNavigatingBack}
            aria-live="polite"
        >
            <AnimatePresence>
                {isNavigatingBack ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className="pointer-events-none absolute inset-0 z-10 rounded-[28px] bg-white/72 backdrop-blur-[1.5px]"
                        aria-hidden="true"
                    >
                        <div className="flex h-full items-center justify-center p-5">
                            <div className="inline-flex items-center gap-3 rounded-full border border-white/80 bg-white/92 px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm">
                                <Loader2 className="h-4 w-4 animate-spin text-brand" />
                                Ürün listesi açılıyor
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <span className="sr-only" role="status">
                {isNavigatingBack ? "Ürün listesi açılıyor." : "Ürün detay başlığı hazır."}
            </span>

            <Button asChild variant="ghost" className="px-0 text-neutral-500 hover:bg-transparent hover:text-neutral-900">
                <Link
                    href="/musteri/tum-urunler"
                    onClick={(event) => {
                        if (isModifiedClick(event)) {
                            return
                        }
                        setIsNavigatingBack(true)
                    }}
                    className={isNavigatingBack ? "pointer-events-none" : undefined}
                    aria-busy={isNavigatingBack}
                >
                    {isNavigatingBack ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <ArrowLeft className="mr-2 h-4 w-4" />
                    )}
                    {isNavigatingBack ? "Ürünler açılıyor..." : "Tüm Ürünlere Dön"}
                </Link>
            </Button>

            <div className="mt-4">
                <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                    {categoryName ?? "Kategori"}
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">{productName}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                    {description}
                </p>
            </div>
        </div>
    )
}
