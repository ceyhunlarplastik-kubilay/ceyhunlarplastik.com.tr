"use client"

import Link from "next/link"
import { ChevronDown, Mail, MapPin, MapPinned, Phone, Truck } from "lucide-react"
import { resolveCustomerNameParts } from "@core/helpers/crm/customerDisplayName"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { BulkSelection } from "@/features/admin/shared/hooks/useBulkSelection"
import type { CustomerMapCustomerGroup } from "@/features/customerLocations/types"

type Props = {
    groups: CustomerMapCustomerGroup[]
    selection: BulkSelection
    customerDetailHref: (customerId: string) => string
    /** Temsilci adı — yalnız `allowSalesFilter` sayfalarında anlamlı. */
    salesUserLabel?: (userId: string) => string | undefined
    isLoading: boolean
    emptyMessage: string
    onShowOnMap: (customerId: string) => void
    /**
     * `true` iken `groups` (üst katmanda zaten önizleme sayısına kısaltılmış)
     * son satırın altında bulanık bir bant + "Tümünü Göster" düğmesiyle biter —
     * `ProductUsageAreasTable`'daki peek desenine benzer, ama accordion satırları
     * kapalı haldeyken yüksekliği yeterince sabit olduğu için `ResizeObserver`
     * yerine sabit bant yüksekliği kullanılır.
     */
    isPeeking?: boolean
    /** Peek bandındaki "Tümünü Göster (N)" etiketi için segmentin TOPLAM müşteri sayısı. */
    totalCount?: number
    onExpandRequest?: () => void
}

/**
 * Harita segmentinin liste görünümü. `LeadCustomerCard`'ın (veri girişi paneli)
 * görsel dilinden esinlenir ama shadcn `Accordion` üzerine kurulur — burada
 * amaç düzenleme/silme değil, adresleri gözden geçirip isteğe bağlı olarak
 * haritada göstermek.
 */
export function CustomerMapCustomerAccordion({
    groups,
    selection,
    customerDetailHref,
    salesUserLabel,
    isLoading,
    emptyMessage,
    onShowOnMap,
    isPeeking = false,
    totalCount = groups.length,
    onExpandRequest,
}: Props) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-20 animate-pulse rounded-2xl border border-neutral-100 bg-neutral-50" />
                ))}
            </div>
        )
    }

    if (groups.length === 0) {
        return (
            <div className="rounded-3xl border border-dashed border-neutral-200 bg-white px-6 py-14 text-center text-sm text-neutral-500 shadow-sm">
                {emptyMessage}
            </div>
        )
    }

    return (
        <div className={isPeeking ? "relative" : undefined}>
            <Accordion type="multiple" className="space-y-3">
                {groups.map((group) => {
                const nameParts = resolveCustomerNameParts(group)
                const repLabel = group.assignedSalesUserId ? salesUserLabel?.(group.assignedSalesUserId) : undefined

                return (
                    <AccordionItem
                        key={group.customerId}
                        value={group.customerId}
                        className={cn(
                            "overflow-hidden rounded-2xl border bg-white",
                            selection.isSelected(group.customerId) ? "border-brand/60 bg-brand/3" : "border-neutral-200",
                        )}
                    >
                        <div className="flex items-start gap-3 px-4">
                            <Checkbox
                                checked={selection.isSelected(group.customerId)}
                                onCheckedChange={() => selection.toggle(group.customerId)}
                                onClick={(event) => event.stopPropagation()}
                                aria-label={`${nameParts.title} seç`}
                                className="mt-4.5 shrink-0"
                            />
                            <AccordionTrigger className="flex-1 py-4 hover:no-underline">
                                <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-start">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold text-neutral-950">{nameParts.title}</span>
                                        {nameParts.subtitle ? (
                                            <span className="text-sm text-neutral-500">{nameParts.subtitle}</span>
                                        ) : null}
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "rounded-full font-normal",
                                                group.status === "CUSTOMER"
                                                    ? "border-teal-200 bg-teal-50 text-teal-700"
                                                    : "border-amber-200 bg-amber-50 text-amber-700",
                                            )}
                                        >
                                            {group.status === "CUSTOMER" ? "Müşteri" : "Potansiyel"}
                                        </Badge>
                                        {repLabel ? (
                                            <Badge variant="outline" className="rounded-full font-normal">
                                                {repLabel}
                                            </Badge>
                                        ) : null}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                                        {group.email ? (
                                            <span className="inline-flex items-center gap-1">
                                                <Mail className="h-3.5 w-3.5" />
                                                {group.email}
                                            </span>
                                        ) : null}
                                        <span className="inline-flex items-center gap-1">
                                            <Phone className="h-3.5 w-3.5" />
                                            {group.phone}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <MapPin className="h-3.5 w-3.5" />
                                            {group.addresses.length} adres
                                        </span>
                                    </div>
                                </div>
                            </AccordionTrigger>
                        </div>

                        <AccordionContent className="px-4">
                            <div className="space-y-2 border-t border-neutral-100 pt-3">
                                {group.addresses.map((address) => (
                                    <div
                                        key={address.addressId}
                                        className="flex items-start gap-2 rounded-xl bg-neutral-50/60 px-3 py-2 text-sm"
                                    >
                                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="font-medium text-neutral-900">{address.addressLabel}</span>
                                                {address.isPrimary ? (
                                                    <Badge variant="outline" className="rounded-full font-normal">
                                                        Birincil
                                                    </Badge>
                                                ) : null}
                                                {address.isShipping ? (
                                                    <Badge variant="outline" className="rounded-full font-normal">
                                                        <Truck className="h-3 w-3" />
                                                        Sevkiyat
                                                    </Badge>
                                                ) : null}
                                            </div>
                                            <p className="text-neutral-500">{address.addressSummary}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-3 flex flex-wrap justify-end gap-2">
                                <Button asChild type="button" variant="outline" size="sm" className="rounded-xl">
                                    <Link href={customerDetailHref(group.customerId)}>Müşteri Detayını Aç</Link>
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={() => onShowOnMap(group.customerId)}
                                >
                                    <MapPinned className="h-3.5 w-3.5" />
                                    Bu Müşteriyi Haritada Göster
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )
            })}
            </Accordion>

            {isPeeking ? (
                <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 flex h-24 items-end justify-center rounded-b-2xl bg-linear-to-b from-white/0 via-white/70 to-white pb-3"
                >
                    <Button
                        type="button"
                        size="sm"
                        className="pointer-events-auto rounded-full shadow-lg"
                        onClick={onExpandRequest}
                    >
                        Tümünü Göster ({totalCount})
                        <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ) : null}
        </div>
    )
}
