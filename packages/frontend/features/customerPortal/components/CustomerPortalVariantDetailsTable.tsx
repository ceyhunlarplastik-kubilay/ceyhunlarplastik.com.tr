"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { CalendarClock, Plus, ShoppingCart, Tags } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type {
    VariantMeasurement,
    VariantTableData,
} from "@/features/public/products/components/ProductVariantTable"
import { formatMeasurementValue } from "@/features/public/products/utils/measurement"
import { usePortalRequestDraftStore } from "@/features/customerPortal/stores/usePortalRequestDraftStore"

interface Props {
    variants: VariantTableData[]
    selectedMeasurements: VariantMeasurement[]
    technicalDrawing?: React.ReactNode
    productName: string
    productId: string
    productSlug: string
    productCode: string
    categoryName?: string
}

function decimalLikeToText(
    value: number | string | { s?: number; e?: number; d?: number[] } | null | undefined,
) {
    if (value === null || value === undefined) return ""
    if (typeof value === "number") return value.toFixed(2)
    if (typeof value === "string") return value

    const sign = value.s === -1 ? "-" : ""
    const digits = Array.isArray(value.d) ? value.d.join("") : ""
    const exponent = typeof value.e === "number" ? value.e : digits.length - 1
    if (!digits) return ""

    if (exponent >= digits.length - 1) {
        return `${sign}${digits}${"0".repeat(exponent - (digits.length - 1))}`
    }

    if (exponent < 0) {
        return `${sign}0.${"0".repeat(Math.abs(exponent) - 1)}${digits}`
    }

    return `${sign}${digits.slice(0, exponent + 1)}.${digits.slice(exponent + 1)}`
}

function resolveMinListPrice(variant: VariantTableData) {
    const priced = (variant.variantSuppliers ?? [])
        .map((supplier) => ({
            value: Number(decimalLikeToText(supplier.listPrice)),
            currency: supplier.currency ?? "TRY",
            pricingUpdatedAt: supplier.pricingUpdatedAt ?? supplier.updatedAt ?? null,
        }))
        .filter((item) => Number.isFinite(item.value))

    if (priced.length === 0) return null
    return priced.reduce((min, current) => current.value < min.value ? current : min)
}

function formatPriceDate(value: string | null | undefined) {
    if (!value) return "-"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"

    return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

export function CustomerPortalVariantDetailsTable({
    variants,
    selectedMeasurements,
    technicalDrawing,
    productName,
    productId,
    productSlug,
    productCode,
    categoryName,
}: Props) {
    const addItem = usePortalRequestDraftStore((state) => state.addItem)
    const totalDraftItems = usePortalRequestDraftStore((state) => state.items.length)
    const [quantityByVariantId, setQuantityByVariantId] = useState<Record<string, string>>({})
    const measurementColumns = Array.from(
        variants
            .flatMap((variant) => variant.measurements)
            .reduce((map, measurement) => {
                map.set(measurement.measurementType.id, measurement.measurementType)
                return map
            }, new Map<string, VariantMeasurement["measurementType"]>())
            .values(),
    ).sort((a, b) => a.displayOrder - b.displayOrder)
    const totalQuantity = useMemo(
        () =>
            Object.values(quantityByVariantId)
                .map((value) => Number(value))
                .filter((value) => Number.isFinite(value) && value > 0)
                .reduce((sum, value) => sum + value, 0),
        [quantityByVariantId],
    )

    function resolveQuantity(variantId: string) {
        const raw = Number(quantityByVariantId[variantId] ?? "1")
        if (!Number.isFinite(raw) || raw <= 0) return 1
        return Math.min(100000, Math.round(raw))
    }

    function handleAddToDraft(variant: VariantTableData) {
        const quantity = resolveQuantity(variant.id)
        const minListPrice = resolveMinListPrice(variant)
        addItem({
            productId,
            productSlug,
            productName,
            productCode,
            variantId: variant.id,
            variantName: variant.name,
            variantKey: selectedMeasurements.map((measurement) => `${measurement.measurementType.code}:${measurement.value}`).join("|"),
            variantFullCode: variant.fullCode,
            quantity,
            listUnitPrice: minListPrice?.value ?? null,
            currency: minListPrice?.currency ?? "TRY",
            targetUnitPrice: null,
            customerNote: "",
        })
        toast.success("Varyant talep taslağına eklendi.")
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm"
            >
                <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900">
                            <ShoppingCart className="h-4 w-4" />
                            Talep Taslağına Ekle
                        </div>
                        <p className="text-sm leading-6 text-neutral-500">
                            Buradan seçtiğiniz varyantları sipariş veya fiyat talebi için taslağa atabilirsiniz.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{totalDraftItems} kalem</Badge>
                        {totalQuantity > 0 ? <Badge variant="outline">Bu ekranda seçilen: {totalQuantity}</Badge> : null}
                        <Button asChild variant="outline">
                            <Link href="/musteri/talepler?composeType=CUSTOMER_ORDER_REQUEST&draft=open">
                                Sepete Git
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="mb-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                            <Tags className="h-3.5 w-3.5" />
                            Uygun Varyant
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-neutral-950">{variants.length}</div>
                    </div>
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                            <ShoppingCart className="h-3.5 w-3.5" />
                            Taslak Kalemi
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-neutral-950">{totalDraftItems}</div>
                    </div>
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                            <CalendarClock className="h-3.5 w-3.5" />
                            Fiyat Takibi
                        </div>
                        <div className="mt-2 text-sm font-medium leading-6 text-neutral-700">
                            Liste fiyatı gösterilen supplier kaydının son fiyat güncellemesi tabloda ayrıca görünür.
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                    <div>
                        <p className="mb-3 text-sm font-medium text-neutral-700">Seçilen Ölçü</p>
                        <div className="flex flex-col items-start gap-2">
                            {selectedMeasurements.length === 0 ? (
                                <p className="text-sm text-neutral-400">Geçerli bir ölçü seçimi bulunamadı.</p>
                            ) : (
                                selectedMeasurements.map((measurement) => (
                                    <Badge key={measurement.id} variant="secondary" className="w-full justify-start text-left">
                                        {measurement.measurementType.name} ({measurement.measurementType.code}):{" "}
                                        {formatMeasurementValue(measurement)}
                                        {measurement.measurementType.baseUnit &&
                                        measurement.measurementType.code !== "D" &&
                                        measurement.measurementType.code !== "M"
                                            ? ` ${measurement.measurementType.baseUnit}`
                                            : ""}
                                    </Badge>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="min-w-0 overflow-hidden rounded-lg border border-neutral-200 p-2">
                        {technicalDrawing ?? (
                            <p className="p-2 text-sm text-neutral-400">Teknik çizim bulunamadı.</p>
                        )}
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm"
            >
                <div className="border-b border-neutral-100 px-4 py-3">
                    <h2 className="text-base font-semibold text-neutral-900">Varyantlar</h2>
                    <p className="mt-1 text-sm text-neutral-500">
                        {categoryName
                            ? `${categoryName} kategorisindeki ${productName} için ölçüye uygun varyantlar ve satış fiyatları aşağıda listelenir.`
                            : `${productName} için ölçüye uygun varyantlar ve satış fiyatları aşağıda listelenir.`}
                    </p>
                </div>

                {variants.length === 0 ? (
                    <div className="p-4 text-sm text-neutral-400">Bu ölçü için varyant bulunamadı.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table className="min-w-[1120px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Full Code</TableHead>
                                    {measurementColumns.map((column) => (
                                        <TableHead key={column.id}>
                                            {column.name} ({column.code})
                                        </TableHead>
                                    ))}
                                    <TableHead>Versiyon</TableHead>
                                    <TableHead>Renk</TableHead>
                                    <TableHead>Ham Madde</TableHead>
                                    <TableHead>Liste Satış Fiyatı</TableHead>
                                    <TableHead>Fiyat Son Güncelleme</TableHead>
                                    <TableHead className="pr-4 text-right">Talep</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {variants.map((variant, index) => {
                                    const minListPrice = resolveMinListPrice(variant)

                                    return (
                                        <motion.tr
                                            key={variant.id}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.22, delay: index * 0.04 }}
                                            className="border-b last:border-0"
                                        >
                                            <TableCell className="font-mono">{variant.fullCode}</TableCell>
                                            {measurementColumns.map((column) => {
                                                const measurement = variant.measurements.find(
                                                    (item) => item.measurementType.id === column.id,
                                                )

                                                if (!measurement) {
                                                    return (
                                                        <TableCell key={`${variant.id}-${column.id}`} className="text-neutral-400">
                                                            -
                                                        </TableCell>
                                                    )
                                                }

                                                const withUnit =
                                                    measurement.measurementType.baseUnit &&
                                                    measurement.measurementType.code !== "D" &&
                                                    measurement.measurementType.code !== "M"
                                                        ? ` ${measurement.measurementType.baseUnit}`
                                                        : ""

                                                return (
                                                    <TableCell key={`${variant.id}-${column.id}`} className="text-xs text-neutral-700">
                                                        {formatMeasurementValue(measurement)}
                                                        {withUnit}
                                                    </TableCell>
                                                )
                                            })}
                                            <TableCell>{variant.versionCode}</TableCell>
                                            <TableCell>
                                                {variant.color ? (
                                                    <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-2.5 py-1 text-xs text-neutral-700">
                                                        <span
                                                            className="h-3 w-3 rounded-full border border-neutral-300"
                                                            style={{ backgroundColor: variant.color.hex || "#ddd" }}
                                                        />
                                                        {variant.color.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-neutral-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {variant.materials.length
                                                    ? variant.materials
                                                        .map((material) =>
                                                            material.code ? `${material.name} (${material.code})` : material.name,
                                                        )
                                                        .join(", ")
                                                    : "-"}
                                            </TableCell>
                                            <TableCell className="font-medium text-neutral-900">
                                                {minListPrice ? (
                                                    <div className="space-y-1">
                                                        <div>{`${minListPrice.value.toFixed(2)} ${minListPrice.currency}`}</div>
                                                        <Badge variant="outline" className="font-normal">
                                                            Liste fiyatı
                                                        </Badge>
                                                    </div>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell>
                                                {minListPrice?.pricingUpdatedAt ? (
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-medium text-neutral-900">
                                                            {formatPriceDate(minListPrice.pricingUpdatedAt)}
                                                        </div>
                                                        <div className="text-xs text-neutral-500">
                                                            Son fiyat revizyonu
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-neutral-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="pr-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={quantityByVariantId[variant.id] ?? "1"}
                                                        onChange={(event) =>
                                                            setQuantityByVariantId((current) => ({
                                                                ...current,
                                                                [variant.id]: event.target.value,
                                                            }))
                                                        }
                                                        className="h-8 w-20"
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => handleAddToDraft(variant)}
                                                    >
                                                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                                                        Ekle
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </motion.tr>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
