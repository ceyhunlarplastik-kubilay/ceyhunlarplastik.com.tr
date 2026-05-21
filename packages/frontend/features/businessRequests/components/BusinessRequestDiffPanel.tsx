"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, MapPin, Minus, Plus, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { BusinessRequest } from "@/features/businessRequests/api/types"
import { cn } from "@/lib/utils"

const FIELD_LABELS: Record<string, string> = {
    name: "Firma Adı",
    contactName: "Yetkili",
    phone: "Telefon",
    email: "E-posta",
    address: "Adres",
    label: "Adres Etiketi",
    country: "Ülke",
    stateName: "İl",
    city: "İlçe",
    district: "Mahalle / Bölge",
    line1: "Açık Adres",
    line2: "Adres Satırı 2",
    postalCode: "Posta Kodu",
    taxOffice: "Vergi Dairesi",
    taxNumber: "Vergi No",
    isPrimary: "Birincil",
    isBilling: "Fatura",
    isShipping: "Sevkiyat",
    note: "Not",
    defaultPaymentTermDays: "Varsayılan Vade",
    price: "Maliyet",
    operationalCostRate: "Operasyonel Maliyet %",
    netCost: "Net Maliyet",
    profitRate: "Kar Oranı %",
    listPrice: "Liste Fiyatı",
    paymentTermDays: "Vade",
    supplierVariantCode: "Tedarikçi Varyant Kodu",
    supplierNote: "Tedarikçi Notu",
    minOrderQty: "Minimum Sipariş",
    stockQty: "Stok",
    currency: "Para Birimi",
    code: "Kod",
    categoryId: "Kategori",
    categoryName: "Kategori Adı",
    productId: "Ürün",
    productCode: "Ürün Kodu",
    productName: "Ürün Adı",
    versionCode: "Versiyon Kodu",
    supplierCode: "Tedarikçi Kodu",
    variantIndex: "Varyant İndeksi",
    colorId: "Renk",
    materialIds: "Malzemeler",
    measurements: "Ölçüler",
    attributeValueIds: "Özellikler",
}

type JsonRecord = Record<string, unknown>

type DiffRow = {
    key: string
    label: string
    currentValue: unknown
    requestedValue: unknown
    changed: boolean
}

type AddressLike = Record<string, unknown>
const CUSTOMER_PROFILE_FIELD_KEYS = ["companyName", "fullName", "phone", "email", "note", "addresses"] as const
const HIDDEN_ADDRESS_DIFF_KEYS = new Set(["id", "displayOrder", "countryId", "stateId", "cityId"])

function areValuesEqual(left: unknown, right: unknown) {
    if (left === right) return true

    if (
        (left === null || left === undefined || left === "")
        && (right === null || right === undefined || right === "")
    ) {
        return true
    }

    try {
        return JSON.stringify(left) === JSON.stringify(right)
    } catch {
        return false
    }
}

function renderValue(value: unknown): string {
    if (value === null || value === undefined || value === "") return "-"
    if (typeof value === "boolean") return value ? "Evet" : "Hayır"
    if (Array.isArray(value)) return value.length > 0 ? value.map(renderValue).join(", ") : "-"

    return String(value)
}

function buildDiffRows(currentSnapshot: JsonRecord, requestedPayload: JsonRecord) {
    const keys = Array.from(new Set([
        ...Object.keys(currentSnapshot),
        ...Object.keys(requestedPayload),
    ]))

    return keys
        .map<DiffRow>((key) => {
            const currentValue = currentSnapshot[key]
            const requestedValue = Object.prototype.hasOwnProperty.call(requestedPayload, key)
                ? requestedPayload[key]
                : currentValue

            return {
                key,
                label: FIELD_LABELS[key] ?? key,
                currentValue,
                requestedValue,
                changed: !areValuesEqual(currentValue, requestedValue),
            }
        })
        .sort((left, right) => {
            if (left.changed !== right.changed) return left.changed ? -1 : 1
            return left.label.localeCompare(right.label, "tr")
        })
}

function getComparisonPayload(request: BusinessRequest) {
    if (request.type === "CUSTOMER_PROFILE_CHANGE") {
        const requestedData = (request.requestedData ?? {}) as JsonRecord
        const proposedProfile = (requestedData.proposedProfile ?? {}) as JsonRecord
        const currentSnapshot = (request.currentSnapshot ?? {}) as JsonRecord

        return {
            currentSnapshot: Object.fromEntries(
                CUSTOMER_PROFILE_FIELD_KEYS.map((key) => [key, currentSnapshot[key]]),
            ) as JsonRecord,
            requestedPayload: Object.fromEntries(
                CUSTOMER_PROFILE_FIELD_KEYS
                    .filter((key) => Object.prototype.hasOwnProperty.call(proposedProfile, key))
                    .map((key) => [key, proposedProfile[key]]),
            ) as JsonRecord,
        }
    }

    return {
        currentSnapshot: (request.currentSnapshot ?? {}) as JsonRecord,
        requestedPayload: (request.requestedData ?? {}) as JsonRecord,
    }
}

function renderAddressSummary(address: AddressLike) {
    return [
        address.line1,
        address.line2,
        address.district,
        address.city,
        address.stateName,
        address.country,
    ]
        .filter(Boolean)
        .map((value) => String(value))
        .join(", ")
}

function buildAddressDiffRows(currentAddress: AddressLike, requestedAddress: AddressLike) {
    const keys = Array.from(new Set([
        ...Object.keys(currentAddress),
        ...Object.keys(requestedAddress),
    ])).filter((key) => !HIDDEN_ADDRESS_DIFF_KEYS.has(key))

    return keys
        .map<DiffRow>((key) => {
            const currentValue = currentAddress[key]
            const requestedValue = Object.prototype.hasOwnProperty.call(requestedAddress, key)
                ? requestedAddress[key]
                : currentValue

            return {
                key,
                label: FIELD_LABELS[key] ?? key,
                currentValue,
                requestedValue,
                changed: !areValuesEqual(currentValue, requestedValue),
            }
        })
        .sort((left, right) => {
            if (left.changed !== right.changed) return left.changed ? -1 : 1
            return left.label.localeCompare(right.label, "tr")
        })
}

function buildAddressDiffCards(request: BusinessRequest, showAllFields: boolean) {
    if (request.type !== "CUSTOMER_PROFILE_CHANGE") return []

    const currentSnapshot = (request.currentSnapshot ?? {}) as JsonRecord
    const requestedData = (request.requestedData ?? {}) as JsonRecord
    const currentAddresses = Array.isArray(currentSnapshot.addresses) ? currentSnapshot.addresses as AddressLike[] : []
    const requestedAddresses = Array.isArray((requestedData.proposedProfile as JsonRecord | undefined)?.addresses)
        ? ((requestedData.proposedProfile as JsonRecord).addresses as AddressLike[])
        : []

    const maxLength = Math.max(currentAddresses.length, requestedAddresses.length)

    return Array.from({ length: maxLength }, (_, index) => {
        const currentAddress = currentAddresses[index] ?? {}
        const requestedAddress = requestedAddresses[index] ?? {}
        const rows = buildAddressDiffRows(currentAddress, requestedAddress)
        const changedRows = rows.filter((row) => row.changed)
        const visibleRows = showAllFields
            ? rows
            : changedRows.length > 0
                ? changedRows
                : rows

        const requestedLabel = renderValue(requestedAddress.label)
        const currentLabel = renderValue(currentAddress.label)

        return {
            key: `address-${index}`,
            title: requestedLabel !== "-" ? requestedLabel : currentLabel !== "-" ? currentLabel : `Adres ${index + 1}`,
            currentSummary: renderAddressSummary(currentAddress),
            requestedSummary: renderAddressSummary(requestedAddress),
            changedCount: changedRows.length,
            visibleRows,
        }
    }).filter((card) => card.visibleRows.length > 0)
}

function getProductPreview(request: BusinessRequest) {
    const product = request.items?.[0]?.productVariant?.product
    if (!product) return null

    const primaryAsset = (product.assets ?? []).find((asset) => asset.role === "PRIMARY")
        ?? (product.assets ?? []).find((asset) => asset.type === "IMAGE")
        ?? null

    return {
        id: product.id,
        code: product.code,
        name: product.name,
        imageUrl: primaryAsset?.url ?? null,
    }
}

type Props = {
    request: BusinessRequest
    showAllFields: boolean
    onToggleShowAll: () => void
}

export function BusinessRequestDiffPanel({
    request,
    showAllFields,
    onToggleShowAll,
}: Props) {
    const { currentSnapshot, requestedPayload } = getComparisonPayload(request)
    const rows = buildDiffRows(currentSnapshot, requestedPayload).filter((row) => row.key !== "addresses")
    const changedRows = rows.filter((row) => row.changed)
    const hiddenCount = Math.max(0, rows.length - changedRows.length)
    const visibleRows = showAllFields ? rows : changedRows
    const productPreview = getProductPreview(request)
    const addressDiffCards = buildAddressDiffCards(request, showAllFields)
    const visibleAddressCards = showAllFields
        ? addressDiffCards
        : addressDiffCards.filter((card) => card.changedCount > 0)
    const totalChangedCount = changedRows.length + addressDiffCards.reduce((sum, card) => sum + card.changedCount, 0)

    return (
        <div className="mx-auto max-w-none space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                        <Sparkles className="h-3.5 w-3.5" />
                        Değişiklik Özeti
                    </div>
                    <p className="text-sm text-neutral-600">
                        {totalChangedCount > 0
                            ? `${totalChangedCount} değişiklik bulundu${hiddenCount > 0 && !showAllFields ? `, ${hiddenCount} aynı alan gizleniyor` : ""}.`
                            : "Fark bulunamadı. Talep ile mevcut kayıt aynı görünüyor."}
                    </p>
                </div>

                {hiddenCount > 0 ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={onToggleShowAll}
                    >
                        {showAllFields ? "Sadece değişenleri göster" : `Tüm alanları göster (${rows.length})`}
                    </Button>
                ) : null}
            </div>

            {request.type === "SUPPLIER_PRICING_CHANGE" && productPreview ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                            {productPreview.imageUrl ? (
                                <Image
                                    src={productPreview.imageUrl}
                                    alt={productPreview.name}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-[11px] text-neutral-400">
                                    Görsel yok
                                </div>
                            )}
                        </div>

                        <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Bağlı Ürün</p>
                            <p className="truncate text-sm font-semibold text-neutral-900">{productPreview.name}</p>
                            <p className="truncate text-xs text-neutral-500">{productPreview.code}</p>
                        </div>
                    </div>

                    <Button asChild variant="outline" size="sm" className="shrink-0">
                        <Link href={`/admin/products/${productPreview.id}/variants`}>
                            Ürüne Git
                            <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            ) : null}

            <div className="space-y-2">
                {visibleRows.map((row) => (
                    <div
                        key={row.key}
                        className={cn(
                            "rounded-xl border p-3 transition-colors",
                            row.changed
                                ? "border-amber-200 bg-white shadow-sm"
                                : "border-neutral-200 bg-white/80",
                        )}
                    >
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-neutral-900">{row.label}</h3>
                            <span
                                className={cn(
                                    "inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium",
                                    row.changed
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-neutral-100 text-neutral-600",
                                )}
                            >
                                {row.changed ? "Değişiyor" : "Aynı"}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className={cn(
                                "rounded-lg border px-2.5 py-1.5",
                                row.changed
                                    ? "border-rose-200 bg-rose-50/80"
                                    : "border-neutral-200 bg-neutral-50",
                            )}>
                                <div className="mb-0.5 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                                    <Minus className="h-3.5 w-3.5" />
                                    Mevcut
                                </div>
                                <p className="whitespace-pre-wrap break-words text-sm leading-6 font-medium text-neutral-900">
                                    {renderValue(row.currentValue)}
                                </p>
                            </div>

                            <div className={cn(
                                "rounded-lg border px-2.5 py-1.5",
                                row.changed
                                    ? "border-emerald-200 bg-emerald-50/80"
                                    : "border-neutral-200 bg-neutral-50",
                            )}>
                                <div className="mb-0.5 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                                    <Plus className="h-3.5 w-3.5" />
                                    Talep
                                </div>
                                <p className="whitespace-pre-wrap break-words text-sm leading-6 font-medium text-neutral-900">
                                    {renderValue(row.requestedValue)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {visibleAddressCards.length > 0 ? (
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                        <MapPin className="h-3.5 w-3.5" />
                        Adres Değişiklikleri
                    </div>

                    <div className="space-y-3">
                        {visibleAddressCards.map((card) => (
                            <div key={card.key} className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-sm font-semibold text-neutral-900">{card.title}</div>
                                    <Badge variant={card.changedCount > 0 ? "default" : "outline"}>
                                        {card.changedCount > 0 ? `${card.changedCount} alan değişiyor` : "Fark yok"}
                                    </Badge>
                                </div>

                                <div className="mt-3 grid gap-2 md:grid-cols-2">
                                    <div className="rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2">
                                        <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Mevcut Adres</div>
                                        <div className="mt-1 text-sm leading-6 text-neutral-900">
                                            {card.currentSummary || "-"}
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2">
                                        <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Talep Edilen Adres</div>
                                        <div className="mt-1 text-sm leading-6 text-neutral-900">
                                            {card.requestedSummary || "-"}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 space-y-2">
                                    {card.visibleRows.map((row) => (
                                        <div key={`${card.key}-${row.key}`} className="grid gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2 md:grid-cols-3">
                                            <div className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">{row.label}</div>
                                            <div className="text-sm text-neutral-700">{renderValue(row.currentValue)}</div>
                                            <div className={cn("text-sm font-medium", row.changed ? "text-emerald-800" : "text-neutral-700")}>
                                                {renderValue(row.requestedValue)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    )
}
