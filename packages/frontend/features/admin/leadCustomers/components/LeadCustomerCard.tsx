"use client"

import type { ReactNode } from "react"
import { ChevronDown, Globe, Mail, Phone, Target, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { resolveCustomerNameParts } from "@core/helpers/crm/customerDisplayName"
import { formatWebsiteLabel } from "@core/helpers/crm/customerWebsite"
import { ConfirmDeleteDialog } from "@/features/admin/shared/components/ConfirmDeleteDialog"
import type { LeadCustomer } from "@/features/admin/leadCustomers/api/types"
import { LeadCustomerDetailPanel } from "./LeadCustomerDetailPanel"

const DELETE_CONFIRMATION = "KALICI OLARAK SİL"

export function LeadCustomerCard({
    customer,
    isExpanded,
    onToggle,
    onEdit,
    isSelected,
    onToggleSelect,
    onDelete,
    isDeleting,
    canDelete,
    canSelect,
    canEdit = true,
    /**
     * "Adresler & Eşleşen Ürünler" genişletmesi `GET /lead-customers/{id}`
     * çağırır (admin/content_editor'a özel) — bu uca erişimi olmayan yüzeyler
     * (satış listeleme görünümü gibi) bunu `false` vererek gizler.
     */
    showDetailToggle = true,
    /**
     * Genişletilince gösterilecek detay paneli — varsayılan admin/veri girişi
     * paneli (`LeadCustomerDetailPanel`, AdminApi'ye bağlı). Farklı boundary'ler
     * (ör. satış paneli) kendi hook'larına bağlı bir sürüm geçirir.
     */
    renderDetail = (customerId) => <LeadCustomerDetailPanel customerId={customerId} />,
}: {
    customer: LeadCustomer
    isExpanded: boolean
    onToggle: () => void
    onEdit: () => void
    isSelected: boolean
    onToggleSelect: () => void
    onDelete: () => void
    isDeleting: boolean
    canDelete: boolean
    /** Toplu seçim kutusu yalnız toplu silme yetkisi varken görünür. */
    canSelect: boolean
    canEdit?: boolean
    showDetailToggle?: boolean
    renderDetail?: (customerId: string) => ReactNode
}) {
    const usageAreaCount = customer.usageAreaValues.length
    const hasProfile = Boolean(customer.sectorValue) || usageAreaCount > 0
    // Firma adı başlık, yetkili adı (varsa) alt satır; ikisi de yoksa fallback.
    const nameParts = resolveCustomerNameParts(customer)
    const websiteLabel = formatWebsiteLabel(customer.websiteUrl)

    return (
        <div
            className={cn(
                "overflow-hidden rounded-2xl border bg-white transition-colors",
                isSelected ? "border-brand/60 bg-brand/3" : "border-neutral-200",
            )}
        >
            <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start lg:justify-between">
                {canSelect ? (
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelect}
                        aria-label={`${resolveCustomerNameParts(customer).title} seç`}
                        className="mt-1 shrink-0"
                    />
                ) : null}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-neutral-950">
                            {nameParts.title}
                        </span>
                        {nameParts.subtitle ? (
                            <span className="text-sm text-neutral-500">{nameParts.subtitle}</span>
                        ) : null}
                        {!hasProfile ? (
                            <Badge
                                variant="outline"
                                className="rounded-full border-amber-200 bg-amber-50 text-[11px] font-medium text-amber-700"
                            >
                                profil atanmamış
                            </Badge>
                        ) : null}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                        {customer.email ? (
                            <span className="inline-flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                {customer.email}
                            </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {customer.phone}
                        </span>
                        {websiteLabel ? (
                            <a
                                href={customer.websiteUrl ?? undefined}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="inline-flex items-center gap-1 text-brand hover:underline"
                                // Kart tıklaması kartı açıp kapatıyor; link onu tetiklemesin.
                                onClick={(event) => event.stopPropagation()}
                            >
                                <Globe className="h-3.5 w-3.5" />
                                {websiteLabel}
                            </a>
                        ) : null}
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {customer.sectorValue ? (
                            <Badge variant="outline" className="rounded-full font-normal">
                                {customer.sectorValue.name}
                            </Badge>
                        ) : null}
                        {customer.productionGroupValue ? (
                            <Badge variant="outline" className="rounded-full font-normal">
                                {customer.productionGroupValue.name}
                            </Badge>
                        ) : null}
                        {customer.usageAreaValues.slice(0, 3).map((value) => (
                            <Badge
                                key={value.id}
                                variant="outline"
                                className="rounded-full border-brand/30 bg-brand/5 font-normal text-brand"
                            >
                                {value.name}
                            </Badge>
                        ))}
                        {usageAreaCount > 3 ? (
                            <span className="text-xs text-neutral-400">
                                +{usageAreaCount - 3} kullanım alanı
                            </span>
                        ) : null}
                    </div>
                </div>

                <div className="flex shrink-0 gap-2">
                    {showDetailToggle ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-2xl"
                            onClick={onToggle}
                        >
                            <Target className="h-4 w-4" />
                            Adresler & Eşleşen Ürünler
                            <ChevronDown
                                className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-180")}
                            />
                        </Button>
                    ) : null}
                    {canEdit ? (
                        <Button type="button" className="rounded-2xl" onClick={onEdit}>
                            Profili Düzenle
                        </Button>
                    ) : null}
                    {canDelete ? (
                        <ConfirmDeleteDialog
                            trigger={
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="size-9 rounded-2xl"
                                    aria-label="Sil"
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                            }
                            title={`${resolveCustomerNameParts(customer).title} silinsin mi?`}
                            description={
                                <>
                                    Bu işlem geri alınamaz. Kaydın adresleri, ziyaretleri ve profil
                                    atamaları da silinir. Siparişi, portal kullanıcısı veya iş talebi
                                    olan kayıtlar silinmez.
                                </>
                            }
                            confirmationPhrase={DELETE_CONFIRMATION}
                            onConfirm={onDelete}
                        />
                    ) : null}
                </div>
            </div>

            {showDetailToggle && isExpanded ? (
                <div className="border-t border-neutral-100 bg-neutral-50/60 p-4">
                    {renderDetail(customer.id)}
                </div>
            ) : null}
        </div>
    )
}
