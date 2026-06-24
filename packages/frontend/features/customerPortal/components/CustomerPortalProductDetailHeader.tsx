"use client"

import Link from "next/link"
import { useState, type MouseEvent } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, Loader2, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CustomerPortalPageHeader } from "@/features/customerPortal/components/CustomerPortalPageHeader"

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
            className="relative"
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
                        className="pointer-events-none absolute inset-0 z-10 rounded-[26px] bg-white/72 backdrop-blur-[1.5px]"
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

            <CustomerPortalPageHeader
                eyebrow="Ürün Detayı"
                icon={Package}
                title={productName}
                description={description}
                meta={[
                    { value: categoryName ?? "Kategori", label: "kategori" },
                ]}
                aside={(
                    <Button asChild variant="outline" className="w-full justify-start gap-2 bg-white/80 xl:w-auto">
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
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ArrowLeft className="h-4 w-4" />
                            )}
                            {isNavigatingBack ? "Ürünler açılıyor..." : "Tüm Ürünlere Dön"}
                        </Link>
                    </Button>
                )}
            />
        </div>
    )
}
