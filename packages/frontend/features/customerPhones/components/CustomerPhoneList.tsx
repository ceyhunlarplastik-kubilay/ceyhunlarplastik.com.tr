"use client"

import { useState } from "react"
import { Phone } from "lucide-react"

import { cn } from "@/lib/utils"
import { customerPhoneHref, listCustomerPhones } from "@core/helpers/crm/customerPhones"
import type { CustomerPhone } from "@/features/customerPhones/types"

type Props = {
    /** Birincil numara (`Customer.phone`). */
    phone?: string | null
    additionalPhones?: ReadonlyArray<Pick<CustomerPhone, "number" | "label" | "displayOrder">> | null
    /**
     * `inline`: kart meta satırı — numaralar yan yana, sarar.
     * `stacked`: tablo hücresi / özet kartı — alt alta.
     */
    layout?: "inline" | "stacked"
    /** Bundan fazlası "+N" düğmesinin arkasında kalır; verilmezse hepsi görünür. */
    maxVisible?: number
    className?: string
}

/**
 * Müşterinin tüm telefonları — birincil önce, ek numaralar etiketiyle. Her numara
 * `tel:` bağlantısıdır (sahadaki temsilci telefondan tek dokunuşla arar). Sıralama
 * kuralı core'da (`listCustomerPhones`), yüzeyler arasında ayrışmasın diye.
 */
export function CustomerPhoneList({
    phone,
    additionalPhones,
    layout = "inline",
    maxVisible,
    className,
}: Props) {
    const [isExpanded, setIsExpanded] = useState(false)
    const phones = listCustomerPhones({ phone, additionalPhones })

    if (phones.length === 0) return null

    const visiblePhones = isExpanded || maxVisible === undefined ? phones : phones.slice(0, maxVisible)
    const hiddenCount = phones.length - visiblePhones.length

    return (
        <ul
            className={cn(
                layout === "inline"
                    ? "inline-flex flex-wrap items-center gap-x-3 gap-y-1"
                    : "flex flex-col gap-0.5",
                className,
            )}
        >
            {visiblePhones.map((entry, index) => (
                <li key={`${entry.number}-${index}`} className="inline-flex min-w-0 items-center gap-1">
                    <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <a
                        href={customerPhoneHref(entry.number)}
                        className="whitespace-nowrap hover:underline"
                        // Kart/satır tıklaması başka bir şey açıyorsa arama onu tetiklemesin.
                        onClick={(event) => event.stopPropagation()}
                    >
                        {entry.number}
                    </a>
                    {entry.label ? (
                        <span className="truncate text-neutral-400">· {entry.label}</span>
                    ) : null}
                </li>
            ))}
            {hiddenCount > 0 ? (
                <li>
                    <button
                        type="button"
                        className="font-medium text-brand hover:underline"
                        aria-label={`${hiddenCount} telefon daha göster`}
                        onClick={(event) => {
                            event.stopPropagation()
                            setIsExpanded(true)
                        }}
                    >
                        +{hiddenCount} numara
                    </button>
                </li>
            ) : null}
        </ul>
    )
}
