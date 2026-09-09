"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

type Props = {
    /**
     * Zaten render edilmiş bir ikon elementi — bileşen REFERANSI değil
     * (ör. `<Forklift className="size-20" />`, `Forklift` değil). React Server
     * Component'lerden (bu overlay'i çağıran `page.tsx` gibi) Client
     * Component'lere yalnız düz elementler geçirilebilir; bir bileşen
     * referansını prop olarak geçirmek "Only plain objects can be passed..."
     * hatası verir. Renk vermeyin — bu component iki kopyayı `currentColor`
     * ile (anahat/dolgu için ayrı `text-*` sarmalayıcılarla) renklendirir.
     */
    icon: ReactNode
    title: string
    description?: string
    className?: string
}

/**
 * Tam ekran, hafif şeffaf, etkileşimi engelleyen (üstte durup altındaki her
 * şeyi doğal olarak bloklayan) yüklenme overlay'i. Verilen ikon iki kez
 * (soluk anahat + marka renkli dolgu için) render edilir; dolgu kopyasının
 * `clip-path` üst inset'i `motion/react` ile %100 (tamamen gizli) ↔ %0
 * (tamamen görünür) arasında animasyonla gidip gelir — gerçek bir SVG mask'e
 * gerek kalmadan ikonu ALTTAN YUKARIYA doğru dolduran/boşaltan bir "sıvı
 * seviyesi" efekti verir. `prefers-reduced-motion`da statik %65 dolu hale
 * düşer.
 *
 * Reuse noktaları:
 *  - Route'a özel `loading.tsx` (App Router Suspense fallback'i) içinde.
 *  - `PageLoadingGate` ile (aynı klasör) — sayfanın kendisi gerçek bir async
 *    sınır taşımadığında (ör. veri client-side bir store'dan senkron okunuyor)
 *    `loading.tsx` sert yenilemede asla görünmez; gate bu overlay'i EN AZ bir
 *    süre garantiyle gösterir.
 */
export function PageLoadingOverlay({ icon, title, description, className }: Props) {
    const reduceMotion = useReducedMotion()

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                "fixed inset-0 z-100 flex flex-col items-center justify-center gap-4 bg-white/70 backdrop-blur-sm",
                className,
            )}
        >
            <div className="relative size-20">
                {/* Taban: soluk anahat — dolgu ne kadar ilerlerse ilerlesin ikon her zaman tam görünür kalır. */}
                <div className="absolute inset-0 text-neutral-300" aria-hidden="true">
                    {icon}
                </div>

                {/* Dolgu: marka rengi, alttan yukarı animasyonlu clip-path ile ortaya çıkar. */}
                <motion.div
                    className="absolute inset-0 overflow-hidden text-brand"
                    aria-hidden="true"
                    animate={reduceMotion ? undefined : {
                        clipPath: [
                            "inset(100% 0% 0% 0%)",
                            "inset(0% 0% 0% 0%)",
                            "inset(100% 0% 0% 0%)",
                        ],
                    }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    style={reduceMotion ? { clipPath: "inset(35% 0% 0% 0%)" } : undefined}
                >
                    {icon}
                </motion.div>
            </div>

            <div className="space-y-0.5 text-center">
                <p className="text-sm font-semibold text-neutral-900">{title}</p>
                {description ? <p className="text-xs text-neutral-500">{description}</p> : null}
            </div>
        </div>
    )
}
