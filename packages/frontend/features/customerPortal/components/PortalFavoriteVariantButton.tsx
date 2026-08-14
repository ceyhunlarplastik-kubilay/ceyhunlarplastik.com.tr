"use client"

import { Heart } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
    isFavorite: boolean
    isPending?: boolean
    onToggle: () => void
    /** Yalnız ikon (tablo satırı) ya da ikon + metin (kart). */
    variant?: "icon" | "labeled"
    className?: string
}

/**
 * Müşterinin kendi favori işareti. Temsilci atamasını temsil ETMEZ; bu buton
 * yalnız `source: "CUSTOMER"` satırını açıp kapatır, dolayısıyla temsilcinin
 * eklediği bir varyantta da boş kalp gösterebilir (müşteri onu ayrıca kendi
 * favorisine alabilir).
 */
export function PortalFavoriteVariantButton({
    isFavorite,
    isPending = false,
    onToggle,
    variant = "icon",
    className,
}: Props) {
    const reduceMotion = useReducedMotion()
    const label = isFavorite ? "Favorilerimden çıkar" : "Favorilerime ekle"

    return (
        <Button
            type="button"
            variant="ghost"
            size={variant === "icon" ? "icon-sm" : "sm"}
            onClick={onToggle}
            disabled={isPending}
            aria-pressed={isFavorite}
            aria-label={label}
            title={label}
            className={cn(
                "rounded-full text-neutral-400 transition-colors hover:bg-rose-50 hover:text-rose-600",
                isFavorite && "text-rose-600",
                variant === "labeled" && "gap-1.5 px-2.5",
                className,
            )}
        >
            <AnimatePresence initial={false} mode="wait">
                <motion.span
                    key={isFavorite ? "on" : "off"}
                    initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={reduceMotion ? undefined : { scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="inline-flex"
                >
                    <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
                </motion.span>
            </AnimatePresence>
            {variant === "labeled" ? (
                <span className="text-xs font-medium">{isFavorite ? "Favorimde" : "Favorime ekle"}</span>
            ) : null}
        </Button>
    )
}
