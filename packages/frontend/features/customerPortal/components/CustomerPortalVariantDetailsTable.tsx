"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { Plus, ShoppingCart, Tags } from "lucide-react"
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
import { CustomerPortalVariantFilters } from "@/features/customerPortal/components/CustomerPortalVariantFilters"
import {
    buildVariantFilterDefaultValues,
    countActiveVariantFilters,
    normalizeVariantPriceRange,
    type AppliedVariantFilters,
} from "@/features/customerPortal/schema/customerPortalVariantFilters"
import { usePortalRequestDraftStore } from "@/features/customerPortal/stores/usePortalRequestDraftStore"
import { formatMoney, resolveCustomerDiscountedPrice } from "@/lib/customers/pricing"

interface Props {
    variants: VariantTableData[]
    selectedMeasurements: VariantMeasurement[]
    productName: string
    productId: string
    productSlug: string
    productCode: string
    categoryName?: string
    customerDiscountPercent?: number | null
    productImageUrl?: string | null
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

function toPriceBound(value: number) {
    return Number(value.toFixed(2))
}

type PreparedVariant = {
    variant: VariantTableData
    minListPrice: ReturnType<typeof resolveMinListPrice>
}

export function CustomerPortalVariantDetailsTable({
    variants,
    selectedMeasurements,
    productName,
    productId,
    productSlug,
    productCode,
    categoryName,
    customerDiscountPercent,
    productImageUrl,
}: Props) {
    const lastAppliedBoundsKeyRef = useRef<string | null>(null)
    const addItem = usePortalRequestDraftStore((state) => state.addItem)
    const totalDraftItems = usePortalRequestDraftStore((state) => state.items.length)
    const [quantityByVariantId, setQuantityByVariantId] = useState<Record<string, string>>({})
    const [refreshKey, setRefreshKey] = useState(0)
    const measurementColumns = Array.from(
        variants
            .flatMap((variant) => variant.measurements)
            .reduce((map, measurement) => {
                map.set(measurement.measurementType.id, measurement.measurementType)
                return map
            }, new Map<string, VariantMeasurement["measurementType"]>())
            .values(),
    ).sort((a, b) => a.displayOrder - b.displayOrder)
    const preparedVariants = useMemo<PreparedVariant[]>(
        () =>
            variants.map((variant) => ({
                variant,
                minListPrice: resolveMinListPrice(variant),
            })),
        [variants],
    )
    const priceCurrencies = useMemo(
        () =>
            Array.from(
                new Set(
                    preparedVariants
                        .map((item) => item.minListPrice?.currency)
                        .filter((currency): currency is string => Boolean(currency)),
                ),
            ),
        [preparedVariants],
    )
    const priceBounds = useMemo(() => {
        if (priceCurrencies.length !== 1) return null

        const pricedValues = preparedVariants
            .map((item) => item.minListPrice?.value)
            .filter((value): value is number => Number.isFinite(value))

        if (pricedValues.length === 0) return null

        return {
            min: toPriceBound(Math.min(...pricedValues)),
            max: toPriceBound(Math.max(...pricedValues)),
            currency: priceCurrencies[0] ?? "TRY",
        }
    }, [preparedVariants, priceCurrencies])
    const priceBoundsKey = `${priceBounds?.currency ?? "none"}:${priceBounds?.min ?? "none"}:${priceBounds?.max ?? "none"}`
    const [appliedFilters, setAppliedFilters] = useState<AppliedVariantFilters>(() => {
        const defaults = buildVariantFilterDefaultValues(null)
        const range = normalizeVariantPriceRange(defaults, null)

        return {
            colorIds: defaults.colorIds,
            materialIds: defaults.materialIds,
            minPrice: range.minPrice,
            maxPrice: range.maxPrice,
        }
    })
    const totalQuantity = useMemo(
        () =>
            Object.values(quantityByVariantId)
                .map((value) => Number(value))
                .filter((value) => Number.isFinite(value) && value > 0)
                .reduce((sum, value) => sum + value, 0),
        [quantityByVariantId],
    )
    const colorOptions = useMemo(() => {
        const counts = new Map<string, { id: string; label: string; count: number; hex?: string | null }>()

        for (const { variant } of preparedVariants) {
            if (!variant.color) continue

            const current = counts.get(variant.color.id)
            counts.set(variant.color.id, {
                id: variant.color.id,
                label: variant.color.name,
                count: (current?.count ?? 0) + 1,
                hex: variant.color.hex ?? null,
            })
        }

        return Array.from(counts.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "tr"))
    }, [preparedVariants])
    const materialOptions = useMemo(() => {
        const counts = new Map<string, { id: string; label: string; count: number }>()

        for (const { variant } of preparedVariants) {
            for (const material of variant.materials) {
                const current = counts.get(material.id)
                counts.set(material.id, {
                    id: material.id,
                    label: material.code ? `${material.name} (${material.code})` : material.name,
                    count: (current?.count ?? 0) + 1,
                })
            }
        }

        return Array.from(counts.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "tr"))
    }, [preparedVariants])
    const filteredVariants = useMemo(() => {
        return preparedVariants.filter(({ variant, minListPrice }) => {
            if (
                appliedFilters.colorIds.length > 0 &&
                (!variant.color || !appliedFilters.colorIds.includes(variant.color.id))
            ) {
                return false
            }

            if (
                appliedFilters.materialIds.length > 0 &&
                !variant.materials.some((material) => appliedFilters.materialIds.includes(material.id))
            ) {
                return false
            }

            if (
                priceBounds &&
                appliedFilters.minPrice !== null &&
                appliedFilters.maxPrice !== null
            ) {
                if (!minListPrice) return false
                if (minListPrice.value < appliedFilters.minPrice || minListPrice.value > appliedFilters.maxPrice) {
                    return false
                }
            }

            return true
        })
    }, [appliedFilters, preparedVariants, priceBounds])
    const activeFilterCount = useMemo(
        () => countActiveVariantFilters(appliedFilters, priceBounds),
        [appliedFilters, priceBounds],
    )

    useEffect(() => {
        if (lastAppliedBoundsKeyRef.current === priceBoundsKey) return
        lastAppliedBoundsKeyRef.current = priceBoundsKey
        const defaults = buildVariantFilterDefaultValues(priceBounds)
        const range = normalizeVariantPriceRange(defaults, priceBounds)

        setAppliedFilters({
            colorIds: defaults.colorIds,
            materialIds: defaults.materialIds,
            minPrice: range.minPrice,
            maxPrice: range.maxPrice,
        })
    }, [priceBoundsKey])

    function resolveQuantity(variantId: string) {
        const raw = Number(quantityByVariantId[variantId] ?? "1")
        if (!Number.isFinite(raw) || raw <= 0) return 1
        return Math.min(100000, Math.round(raw))
    }

    function handleAddToDraft(variant: VariantTableData) {
        const quantity = resolveQuantity(variant.id)
        const minListPrice = resolveMinListPrice(variant)
        const discountedPricing = resolveCustomerDiscountedPrice(minListPrice?.value, customerDiscountPercent)
        addItem({
            productId,
            productSlug,
            productName,
            productCode,
            productImageUrl,
            variantId: variant.id,
            variantName: variant.name,
            variantKey: selectedMeasurements.map((measurement) => `${measurement.measurementType.code}:${measurement.value}`).join("|"),
            variantFullCode: variant.fullCode,
            quantity,
            listUnitPrice: minListPrice?.value ?? null,
            customerUnitPrice: discountedPricing?.customerUnitPrice ?? minListPrice?.value ?? null,
            appliedDiscountPercent: discountedPricing?.appliedDiscountPercent ?? 0,
            currency: minListPrice?.currency ?? "TRY",
            targetUnitPrice: null,
            customerNote: "",
        })
        toast.success("Varyant talep taslağına eklendi.")
    }

    function handleApplyFilters(filters: AppliedVariantFilters) {
        setAppliedFilters(filters)
        setRefreshKey((current) => current + 1)
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
                            <Link href="/musteri/talepler/siparis-talebi">
                                Sepete Git
                            </Link>
                        </Button>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: 0.04 }}
            >
                <CustomerPortalVariantFilters
                    colorOptions={colorOptions}
                    materialOptions={materialOptions}
                    priceBounds={priceBounds}
                    hasMixedPriceCurrencies={priceCurrencies.length > 1}
                    activeFilterCount={activeFilterCount}
                    visibleCount={filteredVariants.length}
                    totalCount={preparedVariants.length}
                    onApply={handleApplyFilters}
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm"
            >
                <div className="border-b border-neutral-100 px-4 py-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-neutral-900">Varyantlar</h2>
                            <p className="mt-1 text-sm text-neutral-500">
                                {categoryName
                                    ? `${categoryName} kategorisindeki ${productName} için ölçüye uygun varyantlar ve satış fiyatları aşağıda listelenir.`
                                    : `${productName} için ölçüye uygun varyantlar ve satış fiyatları aşağıda listelenir.`}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{filteredVariants.length} görünen varyant</Badge>
                            {activeFilterCount > 0 ? <Badge variant="outline">{activeFilterCount} filtre aktif</Badge> : null}
                        </div>
                    </div>
                </div>

                {variants.length === 0 ? (
                    <div className="p-4 text-sm text-neutral-400">Bu ölçü için varyant bulunamadı.</div>
                ) : filteredVariants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 px-4 py-14 text-center">
                        <div className="rounded-full border border-neutral-200 bg-neutral-50 p-4 text-neutral-600 shadow-sm">
                            <Tags className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-semibold text-neutral-900">Filtreyle eslesen varyant bulunamadi</h3>
                            <p className="max-w-xl text-sm leading-6 text-neutral-500">
                                Seçili renk, ham madde veya fiyat aralığına uyan varyant yok. Filtreleri sıfırlayarak tüm uygun varyantları yeniden görebilirsiniz.
                            </p>
                        </div>
                        <Badge variant="outline">Filtre panelinden sıfırlama yapabilirsiniz</Badge>
                    </div>
                ) : (
                    <motion.div
                        key={refreshKey}
                        initial={{ opacity: 0.72, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="overflow-x-auto"
                    >
                        <Table className="min-w-[1120px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ürün Kodu</TableHead>
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
                                {filteredVariants.map(({ variant, minListPrice }, index) => {
                                    const discountedPricing = resolveCustomerDiscountedPrice(minListPrice?.value, customerDiscountPercent)

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
                                                    <div className="space-y-1.5">
                                                        {discountedPricing && discountedPricing.appliedDiscountPercent > 0 ? (
                                                            <>
                                                                <div className="text-xs text-neutral-400 line-through">
                                                                    {formatMoney(discountedPricing.listUnitPrice, minListPrice.currency)}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="text-base font-semibold text-emerald-700">
                                                                        {formatMoney(discountedPricing.customerUnitPrice, minListPrice.currency)}
                                                                    </span>
                                                                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                                                                        %{discountedPricing.appliedDiscountPercent.toLocaleString("tr-TR", {
                                                                            minimumFractionDigits: discountedPricing.appliedDiscountPercent % 1 === 0 ? 0 : 2,
                                                                            maximumFractionDigits: 2,
                                                                        })} müşteri indirimi
                                                                    </Badge>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div>{formatMoney(minListPrice.value, minListPrice.currency)}</div>
                                                        )}
                                                        {/* <Badge variant="outline" className="font-normal">
                                                            Liste satış fiyatı baz alınır
                                                        </Badge> */}
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
                    </motion.div>
                )}
            </motion.div>
        </div>
    )
}
