"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, Mail, MapPin, MapPinned, Package, Phone, Truck } from "lucide-react"
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
import { CustomerProfileMatchedProducts } from "@/features/crm/components/CustomerProfileMatchedProducts"
import { useManagedCustomerMatchedProducts } from "@/features/crm/hooks/useManagedCustomerMatchedProducts"

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

/** Satış panelinde "Kullanım Alanı Ürün Atamaları" sekmesi yok — o metin veri girişi paneline özel. */
const SALES_NO_PROFILE_HINT =
    "Bu müşteriye endüstriyel profil (sektör / kullanım alanı) atanmamış; profille eşleşen ürün gösterilemiyor."
const SALES_NO_MATCH_HINT = "Bu müşterinin profiliyle eşleşen ürün bulunmuyor."

function CustomerMapCustomerAccordionItem({
    group,
    isOpen,
    selection,
    customerDetailHref,
    salesUserLabel,
    onShowOnMap,
}: {
    group: CustomerMapCustomerGroup
    isOpen: boolean
    selection: BulkSelection
    customerDetailHref: (customerId: string) => string
    salesUserLabel?: (userId: string) => string | undefined
    onShowOnMap: (customerId: string) => void
}) {
    const nameParts = resolveCustomerNameParts(group)
    const repLabel = group.assignedSalesUserId ? salesUserLabel?.(group.assignedSalesUserId) : undefined

    // Tembel: eşleşen ürünler yalnız satır AÇILDIĞINDA çekilir (sayfa yükünde değil).
    const matchedQuery = useManagedCustomerMatchedProducts(group.customerId, isOpen)
    const matched = matchedQuery.data

    return (
        <AccordionItem
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

                <div className="mt-4 space-y-2 border-t border-neutral-100 pt-3">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
                        <Package className="h-3.5 w-3.5" />
                        Profille Eşleşen Ürünler
                    </div>
                    {matchedQuery.isError ? (
                        <p className="rounded-2xl border border-dashed border-red-200 bg-red-50/60 px-4 py-4 text-sm text-red-700">
                            Eşleşen ürünler yüklenemedi. Satırı kapatıp yeniden açmayı deneyin.
                        </p>
                    ) : (
                        <CustomerProfileMatchedProducts
                            hasProfile={matched?.hasProfile ?? false}
                            matchedProductCount={matched?.matchedProductCount ?? 0}
                            matchedProducts={matched?.matchedProducts ?? []}
                            isLoading={matchedQuery.isLoading}
                            noProfileHint={SALES_NO_PROFILE_HINT}
                            noMatchHint={SALES_NO_MATCH_HINT}
                        />
                    )}
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
}

/**
 * Harita segmentinin liste görünümü. `LeadCustomerCard`'ın (veri girişi paneli)
 * görsel dilinden esinlenir ama shadcn `Accordion` üzerine kurulur — burada
 * amaç düzenleme/silme değil, adresleri gözden geçirip profille eşleşen ürünleri
 * görmek ve isteğe bağlı olarak haritada göstermek.
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
    // Kontrollü accordion: hangi satırların açık olduğunu bilmek, eşleşen ürünleri
    // yalnız o satırlar için tembel çekmeye yarıyor.
    const [openItems, setOpenItems] = useState<string[]>([])

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
            <Accordion type="multiple" value={openItems} onValueChange={setOpenItems} className="space-y-3">
                {groups.map((group) => (
                    <CustomerMapCustomerAccordionItem
                        key={group.customerId}
                        group={group}
                        isOpen={openItems.includes(group.customerId)}
                        selection={selection}
                        customerDetailHref={customerDetailHref}
                        salesUserLabel={salesUserLabel}
                        onShowOnMap={onShowOnMap}
                    />
                ))}
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
