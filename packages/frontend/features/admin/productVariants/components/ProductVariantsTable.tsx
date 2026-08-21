"use client"

import { Fragment, useMemo, useState } from "react"
import { Box, ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { decimalLikeToFixedText } from "@/lib/utils/decimal"
import {
    formatMeasurementValue,
    resolveMeasurementName,
    resolveMeasurementUnit,
} from "@core/helpers/productVariants/measurementDisplay"

import type { ProductVariant } from "@/features/admin/productVariants/api/types"

type Props = {
    variants: ProductVariant[]
    deletingId?: string | null
    onEdit?: (variant: ProductVariant) => void
    onDelete?: (variant: ProductVariant) => void
    emptyTitle?: string
    emptyDescription?: string
    pricingVisibility?: {
        showPrice?: boolean
        showOperationalCostRate?: boolean
        showNetCost?: boolean
        showProfitRate?: boolean
        showListPrice?: boolean
    }
    pricingLabels?: {
        price?: string
        operationalCostRate?: string
        netCost?: string
        profitRate?: string
        listPrice?: string
    }
    summaryPricingField?: "price" | "netCost" | "listPrice"
}

function formatMoney(
    value: number | string | { s?: number; e?: number; d?: number[] } | null | undefined,
    currency?: string | null
) {
    const text = decimalLikeToFixedText(value)
    return text === "-" ? text : `${text} ${currency ?? "TRY"}`
}

function formatPercent(
    value: number | string | { s?: number; e?: number; d?: number[] } | null | undefined
) {
    const text = decimalLikeToFixedText(value)
    return text === "-" ? text : `%${text}`
}

/**
 * Satış / satınalma / tedarikçi fiyat ekranlarının varyant listesi.
 *
 * Görsel olarak veri girişi matrisindeki kayıtlı varyant tablosuyla AYNI dili
 * konuşur: satır başına BİR fiziksel ürün, ölçüler dinamik kolonlar, tedarikçiler
 * harf rozetleri, detay satır içinde açılır. Fark yalnız içerikte — burada
 * tedarikçi FİYATLARI gösterilir ve hangi fiyat alanının görüneceğini rol belirler.
 */
export function ProductVariantsTable({
    variants,
    deletingId = null,
    onEdit,
    onDelete,
    emptyTitle = "Varyant bulunamadı",
    emptyDescription = "Henüz bu ürüne ait varyant eklenmemiş.",
    pricingVisibility,
    pricingLabels,
    summaryPricingField = "listPrice",
}: Props) {
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const visibility = {
        showPrice: pricingVisibility?.showPrice ?? true,
        showOperationalCostRate: pricingVisibility?.showOperationalCostRate ?? true,
        showNetCost: pricingVisibility?.showNetCost ?? true,
        showProfitRate: pricingVisibility?.showProfitRate ?? true,
        showListPrice: pricingVisibility?.showListPrice ?? true,
    }
    const labels = {
        price: pricingLabels?.price ?? "Ham Maliyet",
        operationalCostRate: pricingLabels?.operationalCostRate ?? "Op. Maliyet",
        netCost: pricingLabels?.netCost ?? "Net Maliyet",
        profitRate: pricingLabels?.profitRate ?? "Kâr Oranı",
        listPrice: pricingLabels?.listPrice ?? "Liste Fiyatı",
    }
    const showActions = Boolean(onEdit || onDelete)

    /**
     * Ölçü kolonları varyantlardan türetilir; sıra SUNUCUDAN geldiği gibi korunur
     * (ürün modelinin ölçü şablonundaki `sortPriority`). Başlık ürün modeline özel
     * adı gösterir, kod ikincil kalır.
     */
    const measurementColumns = useMemo(() => {
        const map = new Map<string, { id: string; name: string; code: string }>()

        for (const variant of variants) {
            for (const measurement of variant.measurements ?? []) {
                const typeId = measurement.measurementType?.id
                if (!typeId || map.has(typeId)) continue
                map.set(typeId, {
                    id: typeId,
                    name: resolveMeasurementName(measurement),
                    code: measurement.measurementType?.code ?? "",
                })
            }
        }

        return Array.from(map.values())
    }, [variants])

    const columnCount = 1 + measurementColumns.length + 4 + (showActions ? 1 : 0)

    if (!variants.length) {
        return (
            <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm">
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full border border-neutral-100 bg-neutral-50">
                        <Box className="size-7 text-neutral-300" />
                    </div>
                    <p className="font-medium text-neutral-900">{emptyTitle}</p>
                    <p className="text-sm text-neutral-500">{emptyDescription}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-8" />
                        <TableHead className="min-w-40">Kod</TableHead>
                        {measurementColumns.map((column) => (
                            <TableHead key={column.id} className="min-w-24">
                                <span className="whitespace-nowrap">{column.name}</span>
                                {column.code ? (
                                    <span className="ms-1 font-mono text-[10px] font-normal text-neutral-500">
                                        {column.code}
                                    </span>
                                ) : null}
                            </TableHead>
                        ))}
                        <TableHead>Versiyon</TableHead>
                        <TableHead>Renk</TableHead>
                        <TableHead>Hammadde</TableHead>
                        <TableHead>Tedarikçiler</TableHead>
                        {showActions ? <TableHead className="text-right">İşlem</TableHead> : null}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {variants.map((variant) => {
                        const isExpanded = expandedId === variant.id
                        const activeSupplier = variant.variantSuppliers.find((supplier) => supplier.isActive)
                        const summaryValue =
                            summaryPricingField === "netCost"
                                ? activeSupplier?.netCost
                                : summaryPricingField === "price"
                                    ? activeSupplier?.price
                                    : activeSupplier?.listPrice
                        const summaryLabel =
                            summaryPricingField === "netCost"
                                ? labels.netCost
                                : summaryPricingField === "price"
                                    ? labels.price
                                    : labels.listPrice

                        return (
                            <Fragment key={variant.id}>
                                <TableRow>
                                    <TableCell className="w-8">
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="size-7"
                                            onClick={() => setExpandedId(isExpanded ? null : variant.id)}
                                            aria-label={isExpanded ? "Detayı kapat" : "Detayı aç"}
                                            aria-expanded={isExpanded}
                                        >
                                            {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                                        </Button>
                                    </TableCell>

                                    <TableCell>
                                        <p className="font-mono text-sm font-medium">{variant.fullCode}</p>
                                        <p className="text-xs text-neutral-500">{variant.name}</p>
                                    </TableCell>

                                    {measurementColumns.map((column) => {
                                        const measurement = (variant.measurements ?? []).find(
                                            (item) => item.measurementType?.id === column.id
                                        )

                                        if (!measurement) {
                                            return (
                                                <TableCell key={`${variant.id}-${column.id}`} className="text-neutral-300">
                                                    —
                                                </TableCell>
                                            )
                                        }

                                        const unit = resolveMeasurementUnit(measurement)
                                        return (
                                            <TableCell key={`${variant.id}-${column.id}`} className="tabular-nums">
                                                {formatMeasurementValue(measurement)}
                                                {unit ? (
                                                    <span className="ms-0.5 text-[10px] font-normal text-neutral-400">{unit}</span>
                                                ) : null}
                                            </TableCell>
                                        )
                                    })}

                                    <TableCell>
                                        {variant.versionCode ? (
                                            <Badge variant="secondary" className="font-mono">{variant.versionCode}</Badge>
                                        ) : (
                                            <span className="text-neutral-400">—</span>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        {variant.color ? (
                                            <span className="flex items-center gap-2 text-sm">
                                                {variant.color.hex ? (
                                                    <span
                                                        className="size-3 shrink-0 rounded-full border"
                                                        style={{ backgroundColor: variant.color.hex }}
                                                    />
                                                ) : null}
                                                {variant.color.name}
                                            </span>
                                        ) : (
                                            <span className="text-neutral-400">—</span>
                                        )}
                                    </TableCell>

                                    <TableCell className="text-sm">
                                        {(variant.materials ?? []).map((material) => material.name).join(", ") || (
                                            <span className="text-neutral-400">—</span>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex flex-wrap items-center gap-1">
                                            {variant.variantSuppliers.length === 0 ? (
                                                <span className="text-neutral-400">—</span>
                                            ) : (
                                                variant.variantSuppliers.map((supplier) => (
                                                    <Badge
                                                        key={supplier.id}
                                                        variant="outline"
                                                        className="font-mono"
                                                        title={supplier.supplier.name}
                                                    >
                                                        {supplier.supplierCode ?? "?"}
                                                    </Badge>
                                                ))
                                            )}
                                            {summaryValue !== undefined && summaryValue !== null ? (
                                                <span className="ms-1 text-xs text-neutral-500">
                                                    {summaryLabel}: {formatMoney(summaryValue, activeSupplier?.currency)}
                                                </span>
                                            ) : null}
                                        </div>
                                    </TableCell>

                                    {showActions ? (
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                {onEdit ? (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="size-7"
                                                        aria-label="Düzenle"
                                                        onClick={() => onEdit(variant)}
                                                    >
                                                        <Pencil className="size-4" />
                                                    </Button>
                                                ) : null}
                                                {onDelete ? (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="size-7"
                                                        aria-label="Sil"
                                                        disabled={deletingId === variant.id}
                                                        onClick={() => onDelete(variant)}
                                                    >
                                                        {deletingId === variant.id ? (
                                                            <Spinner className="size-4" />
                                                        ) : (
                                                            <Trash2 className="size-4 text-red-600" />
                                                        )}
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                    ) : null}
                                </TableRow>

                                {isExpanded ? (
                                    <TableRow className="bg-neutral-50/70 dark:bg-neutral-900/40">
                                        <TableCell colSpan={columnCount} className="py-3">
                                            {variant.variantSuppliers.length === 0 ? (
                                                <p className="text-sm text-neutral-500">
                                                    Bu varyanta bağlı tedarikçi yok.
                                                </p>
                                            ) : (
                                                <div className="overflow-x-auto rounded-md border bg-white dark:bg-neutral-950">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="text-xs">Tedarikçi</TableHead>
                                                                {visibility.showPrice ? <TableHead className="text-xs">{labels.price}</TableHead> : null}
                                                                {visibility.showOperationalCostRate ? <TableHead className="text-xs">{labels.operationalCostRate}</TableHead> : null}
                                                                {visibility.showNetCost ? <TableHead className="text-xs">{labels.netCost}</TableHead> : null}
                                                                {visibility.showProfitRate ? <TableHead className="text-xs">{labels.profitRate}</TableHead> : null}
                                                                {visibility.showListPrice ? <TableHead className="text-xs">{labels.listPrice}</TableHead> : null}
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {variant.variantSuppliers.map((supplier) => (
                                                                <TableRow key={supplier.id}>
                                                                    <TableCell className="text-xs">
                                                                        <span className="flex items-center gap-1.5 font-medium">
                                                                            {supplier.supplierCode ? (
                                                                                <Badge variant="outline" className="px-1 py-0 font-mono text-[10px]">
                                                                                    {supplier.supplierCode}
                                                                                </Badge>
                                                                            ) : null}
                                                                            {supplier.supplier.name}
                                                                            {supplier.isActive ? (
                                                                                <Badge variant="secondary" className="text-[10px]">Aktif</Badge>
                                                                            ) : null}
                                                                        </span>
                                                                        {/* Tedarikçinin referans aldığı kod ürün kodu değil,
                                                                            tedarikçili tam koddur. */}
                                                                        {supplier.fullCode ? (
                                                                            <span className="mt-0.5 block font-mono text-[10px] text-neutral-400">
                                                                                {supplier.fullCode}
                                                                            </span>
                                                                        ) : null}
                                                                    </TableCell>
                                                                    {visibility.showPrice ? (
                                                                        <TableCell className="text-xs">{formatMoney(supplier.price, supplier.currency)}</TableCell>
                                                                    ) : null}
                                                                    {visibility.showOperationalCostRate ? (
                                                                        <TableCell className="text-xs">{formatPercent(supplier.operationalCostRate)}</TableCell>
                                                                    ) : null}
                                                                    {visibility.showNetCost ? (
                                                                        <TableCell className="text-xs">{formatMoney(supplier.netCost, supplier.currency)}</TableCell>
                                                                    ) : null}
                                                                    {visibility.showProfitRate ? (
                                                                        <TableCell className="text-xs">{formatPercent(supplier.profitRate)}</TableCell>
                                                                    ) : null}
                                                                    {visibility.showListPrice ? (
                                                                        <TableCell className="text-xs">{formatMoney(supplier.listPrice, supplier.currency)}</TableCell>
                                                                    ) : null}
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ) : null}
                            </Fragment>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
