"use client"

import { useId, type ReactNode } from "react"

import { cn } from "@/lib/utils"

const SECTION_TONES = {
    neutral: "bg-neutral-100 text-neutral-600",
    brand: "bg-brand/10 text-brand",
    sky: "bg-sky-50 text-sky-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
} as const

export type DialogFormSectionTone = keyof typeof SECTION_TONES

/**
 * Uzun form dialoglarının bölümü: renkli ikon + başlık + açıklama. Bölümler
 * iç içe kart DEĞİL, düz bloklar — dialog gövdesi zaten kendi dolgusuna sahip;
 * renkli kutular mobilde iki kat yatay dolgu harcıyordu. Renk dili ikonda.
 *
 * Kullananlar: `EditCustomerProfileDialog` (admin/temsilci) ve
 * `LeadCustomerProfileDialog` (veri girişi) — iki müşteri formu aynı görünsün.
 * Gövde `divide-y` bir kapta beklenir (bölüm kendi dikey dolgusunu taşır).
 */
export function DialogFormSection({
    icon,
    title,
    description,
    tone = "neutral",
    aside,
    children,
}: {
    icon: ReactNode
    title: string
    description?: string
    tone?: DialogFormSectionTone
    /** Başlığın sağında küçük bilgi (ör. "3 seçili", "Opsiyonel"). */
    aside?: ReactNode
    children: ReactNode
}) {
    const headingId = useId()

    return (
        <section aria-labelledby={headingId} className="space-y-4 py-5 sm:py-6">
            <div className="flex items-start gap-3">
                <span
                    className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-xl [&_svg]:size-4",
                        SECTION_TONES[tone],
                    )}
                >
                    {icon}
                </span>
                <div className="min-w-0 flex-1">
                    <h3 id={headingId} className="text-sm font-semibold text-neutral-950">
                        {title}
                    </h3>
                    {description ? (
                        <p className="mt-0.5 text-xs leading-5 text-neutral-500">{description}</p>
                    ) : null}
                </div>
                {aside ? <div className="shrink-0 pt-1.5">{aside}</div> : null}
            </div>
            {children}
        </section>
    )
}

/** Etiketin yanındaki "(opsiyonel)" ipucu — `FormLabel` içinde kullanılır. */
export function OptionalFieldHint() {
    return <span className="font-normal text-neutral-400">(opsiyonel)</span>
}
