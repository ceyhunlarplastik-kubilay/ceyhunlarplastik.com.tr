"use client"

import { Box, Pencil, Trash2 } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { decimalLikeToFixedText } from "@/lib/utils/decimal"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

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

    if (!variants.length) {
        return (
            <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm">
                <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center">
                        <Box className="w-7 h-7 text-neutral-300" />
                    </div>
                    <p className="font-medium text-neutral-900">{emptyTitle}</p>
                    <p className="text-sm text-neutral-500">{emptyDescription}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm p-3 sm:p-4">
            <div className={`grid ${showActions ? "grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]"} gap-3 border-b px-3 py-2 text-[11px] font-semibold text-neutral-500`}>
                <div>Kod / Ad</div>
                <div>Ölçüler</div>
                <div>Tedarikçi Özeti</div>
                {showActions ? <div>İşlem</div> : null}
            </div>

            <Accordion type="single" collapsible className="w-full">
                <AnimatePresence>
                    {variants.map((variant) => {
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
                            <motion.div
                                key={variant.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                            >
                                <AccordionItem value={variant.id} className="border-b border-neutral-100">
                                    <div className={`grid ${showActions ? "grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]"} items-center gap-3 px-3 py-2`}>
                                        <AccordionTrigger className="py-1 hover:no-underline text-left">
                                            <div>
                                                <p className="font-mono text-xs text-neutral-500">{variant.fullCode}</p>
                                                <p className="font-semibold text-sm text-neutral-900">{variant.name}</p>
                                            </div>
                                        </AccordionTrigger>

                                        <div className="text-xs text-neutral-700">
                                            {variant.measurements.length === 0 ? (
                                                <span className="text-neutral-400 italic">–</span>
                                            ) : (
                                                <div className="flex flex-wrap gap-1">
                                                    {variant.measurements
                                                        .sort((a, b) => (a.measurementType.code < b.measurementType.code ? -1 : 1))
                                                        .map((measurement) => (
                                                            <span
                                                                key={measurement.id}
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-medium"
                                                            >
                                                                {measurement.measurementType.code}: {measurement.value}
                                                            </span>
                                                        ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-xs text-neutral-700">
                                            {activeSupplier ? (
                                                <div className="space-y-0.5">
                                                    <p className="font-medium">{activeSupplier.supplier.name}</p>
                                                    {summaryValue !== undefined ? (
                                                        <p className="text-neutral-500">
                                                            {summaryLabel}: {formatMoney(summaryValue, activeSupplier.currency)}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <span className="text-neutral-400 italic">–</span>
                                            )}
                                        </div>

                                        {showActions ? (
                                            <div className="flex justify-end gap-1">
                                                {onEdit ? (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                                                        onClick={() => onEdit(variant)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                ) : null}
                                                {onDelete ? (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-neutral-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => onDelete(variant)}
                                                        disabled={deletingId === variant.id}
                                                    >
                                                        {deletingId === variant.id ? (
                                                            <Spinner className="size-4 text-red-600" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>

                                    <AccordionContent className="px-3 pb-3">
                                        <div className="rounded-xl border bg-neutral-50 p-3">
                                            <div className="mb-2 text-xs font-semibold text-neutral-600">Varyant Detayları</div>
                                            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                                <div className="rounded-md border bg-white p-2">
                                                    <p className="text-[11px] text-neutral-500">Renk</p>
                                                    {variant.color ? (
                                                        <p className="text-sm font-medium text-neutral-800">
                                                            {variant.color.system} {variant.color.code} · {variant.color.name}
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm text-neutral-400 italic">–</p>
                                                    )}
                                                </div>

                                                <div className="rounded-md border bg-white p-2 md:col-span-2">
                                                    <p className="text-[11px] text-neutral-500">Materyaller</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {variant.materials.length === 0 ? (
                                                            <span className="text-sm text-neutral-400 italic">–</span>
                                                        ) : (
                                                            variant.materials.map((material) => (
                                                                <Badge key={material.id} variant="secondary" className="text-[11px]">
                                                                    {material.name}
                                                                </Badge>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 rounded-md border bg-white p-2">
                                                <p className="text-[11px] text-neutral-500 mb-1">Tedarikçi Fiyat Detayları</p>
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="text-[11px]">Tedarikçi</TableHead>
                                                                {visibility.showPrice ? <TableHead className="text-[11px]">{labels.price}</TableHead> : null}
                                                                {visibility.showOperationalCostRate ? <TableHead className="text-[11px]">{labels.operationalCostRate}</TableHead> : null}
                                                                {visibility.showNetCost ? <TableHead className="text-[11px]">{labels.netCost}</TableHead> : null}
                                                                {visibility.showProfitRate ? <TableHead className="text-[11px]">{labels.profitRate}</TableHead> : null}
                                                                {visibility.showListPrice ? <TableHead className="text-[11px]">{labels.listPrice}</TableHead> : null}
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {variant.variantSuppliers.map((supplier) => (
                                                                <TableRow key={supplier.id}>
                                                                    <TableCell className="text-[11px] font-medium text-neutral-700">
                                                                        {supplier.supplier.name}
                                                                        {supplier.isActive ? " (Aktif)" : ""}
                                                                    </TableCell>
                                                                    {visibility.showPrice ? (
                                                                        <TableCell className="text-[11px]">
                                                                            {formatMoney(supplier.price, supplier.currency)}
                                                                        </TableCell>
                                                                    ) : null}
                                                                    {visibility.showOperationalCostRate ? (
                                                                        <TableCell className="text-[11px]">
                                                                            {formatPercent(supplier.operationalCostRate)}
                                                                        </TableCell>
                                                                    ) : null}
                                                                    {visibility.showNetCost ? (
                                                                        <TableCell className="text-[11px]">
                                                                            {formatMoney(supplier.netCost, supplier.currency)}
                                                                        </TableCell>
                                                                    ) : null}
                                                                    {visibility.showProfitRate ? (
                                                                        <TableCell className="text-[11px]">
                                                                            {formatPercent(supplier.profitRate)}
                                                                        </TableCell>
                                                                    ) : null}
                                                                    {visibility.showListPrice ? (
                                                                        <TableCell className="text-[11px]">
                                                                            {formatMoney(supplier.listPrice, supplier.currency)}
                                                                        </TableCell>
                                                                    ) : null}
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </Accordion>
        </div>
    )
}
