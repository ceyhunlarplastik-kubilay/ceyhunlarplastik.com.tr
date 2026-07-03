"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { SiWhatsapp } from "react-icons/si"
import { toast } from "sonner"
import { BadgePercent, ExternalLink, FileText, Plus, Tags } from "lucide-react"
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
import { usePortalSpecialPrices } from "@/features/customerPortal/hooks/usePortalSpecialPrices"
import {
    CustomerPortalSpecialPriceRequestDialog,
    type CustomerSpecialPriceRequestInitialSelection,
} from "@/features/customerPortal/specialPrices/components/CustomerPortalSpecialPriceRequestDialog"
import {
    mapSpecialPriceToPortalDraftPreview,
    resolvePortalDraftPricing,
    type ResolvedPortalDraftPricing,
    type PortalDraftSpecialPricePreview,
} from "@/features/customerPortal/pricing/portalDraftPricing"
import {
    buildVariantFilterDefaultValues,
    countActiveVariantFilters,
    normalizeVariantPriceRange,
    type AppliedVariantFilters,
} from "@/features/customerPortal/schema/customerPortalVariantFilters"
import { usePortalRequestDraftStore } from "@/features/customerPortal/stores/usePortalRequestDraftStore"
import type { CustomerVariantSpecialPrice } from "@/features/admin/customers/api/types"
import { formatMoney, resolveCustomerDiscountedPrice } from "@/lib/customers/pricing"

interface Props {
    variants: VariantTableData[]
    selectedMeasurements: VariantMeasurement[]
    productName: string
    productId: string
    productSlug: string
    productCode: string
    productCategoryId?: string | null
    categoryName?: string
    customerDiscountPercent?: number | null
    productImageUrl?: string | null
}

const VARIANT_TABLE_HEAD_CLASS =
    "h-9 px-2 text-center align-middle text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500"
const VARIANT_TABLE_CELL_CLASS = "px-2 py-2 text-center align-middle text-[13px]"
const WHATSAPP_PHONE = "905530602946"

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

function formatVariantMeasurementsForMessage(variant: VariantTableData) {
    return variant.measurements
        .slice()
        .sort((a, b) => a.measurementType.displayOrder - b.measurementType.displayOrder)
        .map((measurement) => {
            const withUnit =
                measurement.measurementType.baseUnit &&
                    measurement.measurementType.code !== "D" &&
                    measurement.measurementType.code !== "M"
                    ? ` ${measurement.measurementType.baseUnit}`
                    : ""

            return `${measurement.measurementType.name} (${measurement.measurementType.code}): ${formatMeasurementValue(measurement)}${withUnit}`
        })
        .join(" / ")
}

type PreparedVariant = {
    variant: VariantTableData
    minListPrice: ReturnType<typeof resolveMinListPrice>
}

type PortalVariantPricing = ResolvedPortalDraftPricing & {
    specialPrice: CustomerVariantSpecialPrice | undefined
    specialPricePreview: PortalDraftSpecialPricePreview | null
}

export function CustomerPortalVariantDetailsTable({
    variants,
    selectedMeasurements,
    productName,
    productId,
    productSlug,
    productCode,
    productCategoryId,
    categoryName,
    customerDiscountPercent,
    productImageUrl,
}: Props) {
    const lastAppliedBoundsKeyRef = useRef<string | null>(null)
    const shouldReduceMotion = useReducedMotion()
    const addItem = usePortalRequestDraftStore((state) => state.addItem)
    const draftItems = usePortalRequestDraftStore((state) => state.items)
    const specialPricesQuery = usePortalSpecialPrices()
    const [quantityByVariantId, setQuantityByVariantId] = useState<Record<string, string>>({})
    const [refreshKey, setRefreshKey] = useState(0)
    const [specialPriceRequestOpen, setSpecialPriceRequestOpen] = useState(false)
    const [specialPriceRequestSelection, setSpecialPriceRequestSelection] =
        useState<CustomerSpecialPriceRequestInitialSelection | null>(null)
    const specialPriceByVariantId = useMemo(
        () =>
            new Map(
                (specialPricesQuery.data?.data ?? []).map((specialPrice) => [specialPrice.productVariantId, specialPrice]),
            ),
        [specialPricesQuery.data?.data],
    )
    const draftItemByVariantId = useMemo(
        () => new Map(draftItems.map((item) => [item.variantId, item])),
        [draftItems],
    )
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
    }, [priceBounds, priceBoundsKey])

    function resolveQuantity(variantId: string) {
        const raw = Number(quantityByVariantId[variantId] ?? "1")
        if (!Number.isFinite(raw) || raw <= 0) return 1
        return Math.min(100000, Math.round(raw))
    }

    function resolveBasePricing(variant: VariantTableData) {
        const minListPrice = resolveMinListPrice(variant)
        const discountedPricing = resolveCustomerDiscountedPrice(minListPrice?.value, customerDiscountPercent)

        return {
            listUnitPrice: minListPrice?.value ?? null,
            customerUnitPrice: discountedPricing?.customerUnitPrice ?? minListPrice?.value ?? null,
            appliedDiscountPercent: discountedPricing?.appliedDiscountPercent ?? 0,
            currency: minListPrice?.currency ?? "TRY",
            priceSource: discountedPricing && discountedPricing.appliedDiscountPercent > 0
                ? "CUSTOMER_GENERAL_DISCOUNT" as const
                : "LIST_PRICE" as const,
        }
    }

    function resolvePortalPricing(variant: VariantTableData, quantity?: number): PortalVariantPricing {
        const minListPrice = resolveMinListPrice(variant)
        const specialPrice = specialPriceByVariantId.get(variant.id)
        const specialPricePreview = mapSpecialPriceToPortalDraftPreview(specialPrice)
        const resolved = resolvePortalDraftPricing({
            quantity,
            listUnitPrice: specialPrice?.pricing.listPrice ?? minListPrice?.value ?? null,
            currency: minListPrice?.currency ?? specialPrice?.pricing.currency ?? specialPrice?.currency ?? "TRY",
            generalDiscountPercent: customerDiscountPercent,
            specialPrice: specialPricePreview,
        })

        return {
            ...resolved,
            specialPrice,
            specialPricePreview,
        }
    }

    function handleAddToDraft(variant: VariantTableData) {
        const quantity = resolveQuantity(variant.id)
        const existingQuantity = draftItemByVariantId.get(variant.id)?.quantity ?? 0
        const pricing = resolvePortalPricing(variant, existingQuantity + quantity)
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
            listUnitPrice: pricing.listUnitPrice,
            customerUnitPrice: pricing.customerUnitPrice,
            appliedDiscountPercent: pricing.appliedDiscountPercent,
            generalDiscountPercent: customerDiscountPercent ?? null,
            priceSource: pricing.priceSource,
            specialPriceId: pricing.specialPriceId,
            specialPricePreview: pricing.specialPricePreview,
            specialPriceEligible: pricing.specialPriceEligible,
            specialPriceIneligibilityReason: pricing.specialPriceIneligibilityReason,
            specialPriceIneligibilityMessage: pricing.specialPriceIneligibilityMessage,
            pricingSnapshot: pricing.pricingSnapshot,
            currency: pricing.currency,
            targetUnitPrice: null,
            customerNote: "",
        })
        if (pricing.specialPriceIneligibilityMessage) {
            toast.warning(pricing.specialPriceIneligibilityMessage)
        }
        if (pricing.priceSource === "CUSTOMER_SPECIAL_PRICE") {
            toast.success("Özel fiyat koşulu sağlandı ve sepete uygulandı.")
            return
        }
        toast.success("Varyant talep taslağına eklendi.")
    }

    function handleOpenSpecialPriceRequest(variant: VariantTableData) {
        setSpecialPriceRequestSelection({
            categoryId: productCategoryId ?? null,
            productId,
            productName,
            productCode,
            productVariantId: variant.id,
            variantFullCode: variant.fullCode,
            variantName: variant.name,
        })
        setSpecialPriceRequestOpen(true)
    }

    function handleWhatsappPriceRequest(variant: VariantTableData) {
        const currentUrl = window.location.href
        const variantMeasurements = formatVariantMeasurementsForMessage(variant)
        const messageLines = [
            "Merhaba. Müşteri portalında incelediğim ürün için hızlı fiyat almak istiyorum.",
            categoryName ? `Kategori: ${categoryName}` : null,
            `Ürün Modeli: ${productName}`,
            `Katalog Kodu: ${productCode}`,
            variant.name ? `Varyant: ${variant.name}` : null,
            `Varyant Kodu: ${variant.fullCode}`,
            variant.versionCode ? `Versiyon: ${variant.versionCode}` : null,
            selectedMeasurements.length > 0 ? `Seçili Ölçü Grubu: ${selectedMeasurements.map((measurement) => `${measurement.measurementType.name} (${measurement.measurementType.code}): ${formatMeasurementValue(measurement)}`).join(" / ")}` : null,
            variantMeasurements ? `Varyant Ölçüleri: ${variantMeasurements}` : null,
            `Sayfa Linki: ${currentUrl}`,
        ].filter((line): line is string => Boolean(line))
        const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(messageLines.join("\n"))}`

        window.open(whatsappUrl, "_blank", "noopener,noreferrer")
    }

    function handleApplyFilters(filters: AppliedVariantFilters) {
        setAppliedFilters(filters)
        setRefreshKey((current) => current + 1)
    }

    return (
        <div className="space-y-6">
            {/* <motion.div
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
            </motion.div> */}

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
                        <Table className="min-w-[1060px] text-[13px]">
                            <TableHeader className="bg-neutral-50/90">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className={`${VARIANT_TABLE_HEAD_CLASS} min-w-[108px]`}>Ürün Kodu</TableHead>
                                    {measurementColumns.map((column) => (
                                        <TableHead key={column.id} className={`${VARIANT_TABLE_HEAD_CLASS} min-w-[76px]`}>
                                            {column.name} ({column.code})
                                        </TableHead>
                                    ))}
                                    <TableHead className={`${VARIANT_TABLE_HEAD_CLASS} min-w-[72px]`}>Versiyon</TableHead>
                                    <TableHead className={`${VARIANT_TABLE_HEAD_CLASS} min-w-[104px]`}>Renk</TableHead>
                                    <TableHead className={`${VARIANT_TABLE_HEAD_CLASS} min-w-[210px]`}>Ham Madde</TableHead>
                                    <TableHead className={`${VARIANT_TABLE_HEAD_CLASS} min-w-[220px]`}>Müşteri Fiyatı</TableHead>
                                    <TableHead className={`${VARIANT_TABLE_HEAD_CLASS} min-w-[116px]`}>Fiyat Son Güncelleme</TableHead>
                                    <TableHead className={`${VARIANT_TABLE_HEAD_CLASS} min-w-[224px] pr-3`}>Talep</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredVariants.map(({ variant, minListPrice }, index) => {
                                    const basePricing = resolveBasePricing(variant)
                                    const selectedQuantity = resolveQuantity(variant.id)
                                    const existingDraftQuantity = draftItemByVariantId.get(variant.id)?.quantity ?? 0
                                    const effectiveQuantity = existingDraftQuantity + selectedQuantity
                                    const selectedPricing = resolvePortalPricing(variant, effectiveQuantity)
                                    const specialPricePreview = selectedPricing.specialPricePreview
                                    const hasSpecialPrice = Boolean(specialPricePreview)
                                    const specialPriceApplied = selectedPricing.priceSource === "CUSTOMER_SPECIAL_PRICE"

                                    return (
                                        <motion.tr
                                            key={variant.id}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.22, delay: index * 0.04 }}
                                            className="border-b border-neutral-100 align-middle transition-colors last:border-0 hover:bg-neutral-50/70"
                                        >
                                            <TableCell className={`${VARIANT_TABLE_CELL_CLASS} font-mono text-xs font-medium text-neutral-800`}>
                                                {variant.fullCode}
                                            </TableCell>
                                            {measurementColumns.map((column) => {
                                                const measurement = variant.measurements.find(
                                                    (item) => item.measurementType.id === column.id,
                                                )

                                                if (!measurement) {
                                                    return (
                                                        <TableCell key={`${variant.id}-${column.id}`} className={`${VARIANT_TABLE_CELL_CLASS} text-neutral-400`}>
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
                                                    <TableCell key={`${variant.id}-${column.id}`} className={`${VARIANT_TABLE_CELL_CLASS} text-xs font-medium text-neutral-700`}>
                                                        {formatMeasurementValue(measurement)}
                                                        {withUnit}
                                                    </TableCell>
                                                )
                                            })}
                                            <TableCell className={VARIANT_TABLE_CELL_CLASS}>{variant.versionCode}</TableCell>
                                            <TableCell className={VARIANT_TABLE_CELL_CLASS}>
                                                {variant.color ? (
                                                    <span className="inline-flex items-center justify-center gap-1.5 rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-700">
                                                        <span
                                                            className="h-2.5 w-2.5 rounded-full border border-neutral-300"
                                                            style={{ backgroundColor: variant.color.hex || "#ddd" }}
                                                        />
                                                        {variant.color.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-neutral-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className={`${VARIANT_TABLE_CELL_CLASS} whitespace-normal text-left`}>
                                                {variant.materials.length ? (
                                                    <div className="flex min-w-[190px] max-w-[230px] flex-col gap-1.5">
                                                        {variant.materials.map((material) => {
                                                            const certificateCount = (material.assets ?? []).filter(
                                                                (asset) => asset.type === "PDF" && asset.role === "CERTIFICATE",
                                                            ).length
                                                            const label = material.code ? `${material.name} (${material.code})` : material.name

                                                            if (certificateCount === 0) {
                                                                return (
                                                                    <span
                                                                        key={material.id}
                                                                        className="inline-flex w-fit max-w-full items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-600"
                                                                    >
                                                                        <span className="truncate">{label}</span>
                                                                    </span>
                                                                )
                                                            }

                                                            return (
                                                                <Link
                                                                    key={material.id}
                                                                    href={`/ham-madde-sertifikalari/${material.id}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="group rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-left shadow-sm transition hover:border-amber-300 hover:bg-white hover:shadow-md"
                                                                >
                                                                    <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-amber-950">
                                                                        <FileText className="h-3.5 w-3.5 text-amber-700" />
                                                                        <span className="truncate">{label}</span>
                                                                    </span>
                                                                    <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 group-hover:text-amber-900">
                                                                        Sertifikayı incele
                                                                        <ExternalLink className="h-3 w-3" />
                                                                    </span>
                                                                </Link>
                                                            )
                                                        })}
                                                    </div>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                            <TableCell className={`${VARIANT_TABLE_CELL_CLASS} whitespace-normal font-medium text-neutral-900`}>
                                                {minListPrice || basePricing.customerUnitPrice !== null || hasSpecialPrice ? (
                                                    <div className="mx-auto max-w-[220px] space-y-1.5 text-left">
                                                        <div className="rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5">
                                                            <div className="text-[10px] uppercase tracking-[0.12em] text-neutral-400">
                                                                Liste fiyatı
                                                            </div>
                                                            <div className={`mt-0.5 text-sm ${basePricing.appliedDiscountPercent > 0 ? "text-neutral-400 line-through" : "text-neutral-900"}`}>
                                                                {formatMoney(basePricing.listUnitPrice, basePricing.currency)}
                                                            </div>
                                                        </div>

                                                        {basePricing.appliedDiscountPercent > 0 ? (
                                                            <div className="rounded-xl border border-sky-200 bg-sky-50 px-2.5 py-1.5">
                                                                <div className="text-[10px] uppercase tracking-[0.12em] text-sky-700">
                                                                    Sizin fiyatınız
                                                                </div>
                                                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                                    <span className="text-sm font-semibold text-sky-950">
                                                                        {formatMoney(basePricing.customerUnitPrice, basePricing.currency)}
                                                                    </span>
                                                                    <Badge className="h-5 border border-sky-200 bg-sky-100 px-1.5 text-[10px] text-sky-800 hover:bg-sky-100">
                                                                        %{basePricing.appliedDiscountPercent.toLocaleString("tr-TR", {
                                                                            minimumFractionDigits: basePricing.appliedDiscountPercent % 1 === 0 ? 0 : 2,
                                                                            maximumFractionDigits: 2,
                                                                        })} genel iskonto
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        ) : null}

                                                        {specialPricePreview ? (
                                                            <motion.div
                                                                animate={!shouldReduceMotion && specialPriceApplied
                                                                    ? {
                                                                        boxShadow: [
                                                                            "0 0 0 0 rgba(245, 158, 11, 0)",
                                                                            "0 0 0 4px rgba(245, 158, 11, 0.14)",
                                                                            "0 0 0 0 rgba(245, 158, 11, 0)",
                                                                        ],
                                                                    }
                                                                    : undefined}
                                                                transition={{ duration: 2.2, repeat: specialPriceApplied ? Infinity : 0, ease: "easeInOut" }}
                                                                className={`rounded-xl border px-2.5 py-1.5 ${specialPriceApplied
                                                                    ? "border-amber-300 bg-amber-50"
                                                                    : "border-amber-200 bg-amber-50/70"}`}
                                                            >
                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                    <Badge className="h-5 border border-amber-300 bg-amber-100 px-1.5 text-[10px] text-amber-900 hover:bg-amber-100">
                                                                        <BadgePercent className="mr-1 h-3 w-3" />
                                                                        Özel anlaşmalı fiyat
                                                                    </Badge>
                                                                    {specialPriceApplied ? (
                                                                        <Badge className="h-5 border border-amber-300 bg-white px-1.5 text-[10px] text-amber-900 hover:bg-white">
                                                                            Bu adet için uygulanır
                                                                        </Badge>
                                                                    ) : null}
                                                                </div>
                                                                <div className="mt-1 text-base font-semibold text-amber-950">
                                                                    {formatMoney(specialPricePreview.price, specialPricePreview.currency)}
                                                                </div>
                                                                <div className="mt-1 flex flex-wrap gap-1.5">
                                                                    {specialPricePreview.minOrderQuantity ? (
                                                                        <Badge variant="outline" className="h-5 border-amber-200 bg-white/70 px-1.5 text-[10px] font-normal text-amber-900">
                                                                            Min. {specialPricePreview.minOrderQuantity} adet
                                                                        </Badge>
                                                                    ) : null}
                                                                    {specialPricePreview.maxOrderQuantity ? (
                                                                        <Badge variant="outline" className="h-5 border-amber-200 bg-white/70 px-1.5 text-[10px] font-normal text-amber-900">
                                                                            Max. {specialPricePreview.maxOrderQuantity} adet
                                                                        </Badge>
                                                                    ) : null}
                                                                    {specialPricePreview.paymentTermLabel ? (
                                                                        <Badge variant="outline" className="h-5 border-amber-200 bg-white/70 px-1.5 text-[10px] font-normal text-amber-900">
                                                                            {specialPricePreview.paymentTermLabel}
                                                                        </Badge>
                                                                    ) : null}
                                                                </div>
                                                                {!specialPriceApplied && selectedPricing.specialPriceIneligibilityMessage ? (
                                                                    <div className="mt-2 text-xs leading-5 text-amber-800">
                                                                        {selectedPricing.specialPriceIneligibilityMessage}
                                                                    </div>
                                                                ) : null}
                                                                {existingDraftQuantity > 0 ? (
                                                                    <div className="mt-2 text-[11px] leading-5 text-amber-700">
                                                                        Sepetteki mevcut {existingDraftQuantity} adet ile toplam {effectiveQuantity} adet üzerinden değerlendirilir.
                                                                    </div>
                                                                ) : null}
                                                            </motion.div>
                                                        ) : null}
                                                    </div>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell className={`${VARIANT_TABLE_CELL_CLASS} text-neutral-700`}>
                                                {minListPrice?.pricingUpdatedAt ? (
                                                    <div className="space-y-0.5">
                                                        <div className="text-xs font-medium text-neutral-900">
                                                            {formatPriceDate(minListPrice.pricingUpdatedAt)}
                                                        </div>
                                                        <div className="text-[11px] text-neutral-500">
                                                            Son fiyat revizyonu
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-neutral-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className={`${VARIANT_TABLE_CELL_CLASS} pr-3`}>
                                                <div className="mx-auto grid w-[216px] max-w-full gap-2">
                                                    <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-2">
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            aria-label="Talep adedi"
                                                            value={quantityByVariantId[variant.id] ?? "1"}
                                                            onChange={(event) =>
                                                                setQuantityByVariantId((current) => ({
                                                                    ...current,
                                                                    [variant.id]: event.target.value,
                                                                }))
                                                            }
                                                            className="h-9 w-full rounded-xl border-neutral-200 bg-white text-center text-sm font-medium text-neutral-900 shadow-sm"
                                                        />
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            className="h-9 w-full justify-center rounded-xl bg-neutral-950 px-3 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800"
                                                            onClick={() => handleAddToDraft(variant)}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                            <span className="whitespace-nowrap">Sepete Ekle</span>
                                                        </Button>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-9 w-full justify-center rounded-xl border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-900 shadow-sm shadow-amber-900/5 hover:border-amber-300 hover:bg-amber-100 hover:text-amber-950"
                                                        onClick={() => handleOpenSpecialPriceRequest(variant)}
                                                    >
                                                        <BadgePercent className="h-4 w-4" />
                                                        <span className="whitespace-nowrap">Özel Fiyat Talep Et</span>
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="h-9 w-full justify-center rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-700"
                                                        onClick={() => handleWhatsappPriceRequest(variant)}
                                                        aria-label="WhatsApp üzerinden hızlı fiyat al"
                                                    >
                                                        <SiWhatsapp className="h-4 w-4" />
                                                        <span className="whitespace-nowrap">Hızlı Fiyat Al</span>
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
            {specialPriceRequestOpen ? (
                <CustomerPortalSpecialPriceRequestDialog
                    open={specialPriceRequestOpen}
                    onOpenChange={(nextOpen) => {
                        setSpecialPriceRequestOpen(nextOpen)
                        if (!nextOpen) setSpecialPriceRequestSelection(null)
                    }}
                    initialSelection={specialPriceRequestSelection}
                />
            ) : null}
        </div>
    )
}
