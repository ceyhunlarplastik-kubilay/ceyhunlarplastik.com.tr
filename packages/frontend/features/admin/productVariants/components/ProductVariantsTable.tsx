"use client"

import { Box, Pencil, Trash2 } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
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
    deletingId: string | null
    onEdit: (variant: ProductVariant) => void
    onDelete: (variant: ProductVariant) => void
}

function parseDecimalLikeToNumber(
    value: number | string | { s?: number; e?: number; d?: number[] } | null | undefined
) {
    if (value === null || value === undefined) return null
    if (typeof value === "number") return Number.isFinite(value) ? value : null
    if (typeof value === "string") {
        const parsed = Number(value.replace(",", "."))
        return Number.isFinite(parsed) ? parsed : null
    }
    const sign = value.s === -1 ? "-" : ""
    const digits = Array.isArray(value.d) ? value.d.join("") : ""
    const exponent = typeof value.e === "number" ? value.e : digits.length - 1
    if (!digits) return null
    let decimalText = ""
    if (exponent >= digits.length - 1) {
        decimalText = `${sign}${digits}${"0".repeat(exponent - (digits.length - 1))}`
    } else if (exponent < 0) {
        decimalText = `${sign}0.${"0".repeat(Math.abs(exponent) - 1)}${digits}`
    } else {
        decimalText = `${sign}${digits.slice(0, exponent + 1)}.${digits.slice(exponent + 1)}`
    }
    const parsed = Number(decimalText)
    return Number.isFinite(parsed) ? parsed : null
}

function formatMoney(
    value: number | string | { s?: number; e?: number; d?: number[] } | null | undefined,
    currency?: string | null
) {
    const parsed = parseDecimalLikeToNumber(value)
    if (parsed === null) return "-"
    return `${parsed.toFixed(2)} ${currency ?? "TRY"}`
}

function formatPercent(
    value: number | string | { s?: number; e?: number; d?: number[] } | null | undefined
) {
    const parsed = parseDecimalLikeToNumber(value)
    if (parsed === null) return "-"
    return `%${parsed.toFixed(2)}`
}

export function ProductVariantsTable({
    variants,
    deletingId,
    onEdit,
    onDelete,
}: Props) {
    if (!variants.length) {
        return (
            <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm">
                <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center">
                        <Box className="w-7 h-7 text-neutral-300" />
                    </div>
                    <p className="font-medium text-neutral-900">Varyant bulunamadı</p>
                    <p className="text-sm text-neutral-500">Henüz bu ürüne ait varyant eklenmemiş.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm p-3 sm:p-4">
            <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 px-3 py-2 text-[11px] font-semibold text-neutral-500 border-b">
                <div>Kod / Ad</div>
                <div>Ölçüler</div>
                <div>Tedarikçi Özeti</div>
                <div>İşlem</div>
            </div>

            <Accordion type="single" collapsible className="w-full">
                <AnimatePresence>
                    {variants.map((variant) => {
                        const activeSupplier = variant.variantSuppliers.find((supplier) => supplier.isActive)
                        return (
                            <motion.div
                                key={variant.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                            >
                                <AccordionItem value={variant.id} className="border-b border-neutral-100">
                                    <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 items-center px-3 py-2">
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
                                                    <p className="text-neutral-500">
                                                        L: {formatMoney(activeSupplier.listPrice, activeSupplier.currency)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-neutral-400 italic">–</span>
                                            )}
                                        </div>

                                        <div className="flex justify-end gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                                                onClick={() => onEdit(variant)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
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
                                        </div>
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
                                                                <TableHead className="text-[11px]">Ham Maliyet</TableHead>
                                                                <TableHead className="text-[11px]">Op. Maliyet</TableHead>
                                                                <TableHead className="text-[11px]">Net Maliyet</TableHead>
                                                                <TableHead className="text-[11px]">Kâr Oranı</TableHead>
                                                                <TableHead className="text-[11px]">Liste Fiyatı</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {variant.variantSuppliers.map((supplier) => (
                                                                <TableRow key={supplier.id}>
                                                                    <TableCell className="text-[11px] font-medium text-neutral-700">
                                                                        {supplier.supplier.name}
                                                                        {supplier.isActive ? " (Aktif)" : ""}
                                                                    </TableCell>
                                                                    <TableCell className="text-[11px]">
                                                                        {formatMoney(supplier.price, supplier.currency)}
                                                                    </TableCell>
                                                                    <TableCell className="text-[11px]">
                                                                        {formatPercent(supplier.operationalCostRate)}
                                                                    </TableCell>
                                                                    <TableCell className="text-[11px]">
                                                                        {formatMoney(supplier.netCost, supplier.currency)}
                                                                    </TableCell>
                                                                    <TableCell className="text-[11px]">
                                                                        {formatPercent(supplier.profitRate)}
                                                                    </TableCell>
                                                                    <TableCell className="text-[11px]">
                                                                        {formatMoney(supplier.listPrice, supplier.currency)}
                                                                    </TableCell>
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
