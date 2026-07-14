"use client"

import { useMemo, useState, type MouseEvent } from "react"
import { AnimatePresence, motion } from "motion/react"
import { CircleHelp, Loader2, Palette, Ruler, Layers3, Hash } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { ButtonShine } from "@/components/ui/button-shine"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    buildMeasurementKey,
    formatMeasurementValue,
    toMeasurementLabel,
} from "@/features/public/products/utils/measurement"
import { formatColorLabel } from "@/lib/color/formatColorLabel"
import ProductVariantNavigationOverlay from "@/features/public/products/components/ProductVariantNavigationOverlay"

export type MeasurementTypeDetails = {
    id: string
    name: string
    code: string
    baseUnit: string
    displayOrder: number
}

export type VariantMeasurement = {
    id: string
    value: number
    label: string
    measurementType: MeasurementTypeDetails
}

export type VariantColor = {
    id: string
    name: string
    system?: string
    code?: string
    hex?: string
}

export type VariantMaterial = {
    id: string
    name: string
    code?: string | null
    assets?: Array<{
        id: string
        key: string
        mimeType: string
        type: string
        role: string
        url?: string
        createdAt?: string
        updatedAt?: string
    }>
}

export type VariantSupplier = {
    id: string
    isActive?: boolean
    currency?: string | null
    price?: number | string | { s?: number; e?: number; d?: number[] } | null
    listPrice?: number | string | { s?: number; e?: number; d?: number[] } | null
    pricingUpdatedAt?: string | null
    updatedAt?: string
    supplier: {
        id: string
        name: string
    }
}

export type VariantTableData = {
    id: string
    name: string
    versionCode: string
    fullCode: string
    measurements: VariantMeasurement[]
    color?: VariantColor | null
    materials: VariantMaterial[]
    variantSuppliers?: VariantSupplier[]
}

type GroupedMeasurementOption = {
    key: string
    label: string
    measurements: VariantMeasurement[]
    colors: VariantColor[]
    materials: VariantMaterial[]
    suppliers: Array<{
        supplierId: string
        supplierName: string
        priceText: string
        currency: string
        isActive: boolean
    }>
    minPrice?: {
        value: number
        currency: string
    }
    fullCodes: string[]
}

interface ProductVariantTableProps {
    variants: VariantTableData[]
    productSlug: string
    technicalDrawing?: React.ReactNode
    productId: string
    variantDetailsPathname?: string
    focusOnMeasurements?: boolean
    measurementHelpVideoUrl?: string
    // P1.8f: veri fetch'i BAŞARISIZ olduğunda true. Boş varyant listesi "varyant
    // yok" değil "yüklenemedi" olarak gösterilsin diye — yanıltıcı empty state'i
    // hata state'inden ayırır.
    loadError?: boolean
}

function MeasurementHelpDialogButton({
    measurementCode,
    videoUrl,
}: {
    measurementCode: string
    videoUrl: string
}) {
    const t = useTranslations("public.productVariant.help")
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    type="button"
                    aria-label={t("videoAria", { code: measurementCode })}
                    className="relative inline-flex size-5 items-center justify-center rounded-full text-brand transition hover:text-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
                    onClick={(event) => event.stopPropagation()}
                >
                    <motion.span
                        className="absolute inset-0 rounded-full bg-brand/15"
                        animate={{
                            scale: [1, 1.55, 1],
                            opacity: [0.25, 0.75, 0.25],
                        }}
                        transition={{
                            duration: 1.8,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                    <motion.span
                        className="absolute inset-0 rounded-full border border-brand/40"
                        animate={{
                            scale: [1, 1.85],
                            opacity: [0.55, 0],
                        }}
                        transition={{
                            duration: 1.9,
                            repeat: Infinity,
                            ease: "easeOut",
                        }}
                    />
                    <CircleHelp className="relative z-10 size-3.5" />
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl overflow-hidden p-0">
                <DialogTitle className="sr-only">{t("dialogTitle")}</DialogTitle>
                <div className="aspect-video w-full bg-black">
                    <iframe
                        className="h-full w-full"
                        src={videoUrl}
                        title={t("videoTitle", { code: measurementCode })}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}

function decimalLikeToText(
    value: number | string | { s?: number; e?: number; d?: number[] } | null | undefined
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

function decimalLikeToNumber(
    value: number | string | { s?: number; e?: number; d?: number[] } | null | undefined
) {
    const text = decimalLikeToText(value)
    if (!text || text === "-") return null
    const parsed = Number(text)
    return Number.isFinite(parsed) ? parsed : null
}

function isModifiedClick(event: MouseEvent) {
    return (
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.button !== 0
    )
}

export default function ProductVariantTable({
    variants,
    productSlug,
    technicalDrawing,
    productId,
    variantDetailsPathname,
    focusOnMeasurements = false,
    measurementHelpVideoUrl = "https://www.youtube.com/embed/42mrTRiExjs?autoplay=1",
    loadError = false,
}: ProductVariantTableProps) {
    const t = useTranslations("public.productVariant.table")
    const { data: session } = useSession()
    const [pendingVariantKey, setPendingVariantKey] = useState<string | null>(null)
    const options = useMemo<GroupedMeasurementOption[]>(() => {
        const groups = new Map<string, GroupedMeasurementOption>()

        for (const variant of variants) {
            const key = buildMeasurementKey(variant.measurements)
            const existing = groups.get(key)

            if (!existing) {
                groups.set(key, {
                    key,
                    label: toMeasurementLabel(variant.measurements),
                    measurements: [...variant.measurements].sort(
                        (a, b) => a.measurementType.displayOrder - b.measurementType.displayOrder
                    ),
                    colors: variant.color ? [variant.color] : [],
                    materials: [...variant.materials],
                    suppliers: (variant.variantSuppliers ?? []).map((item) => ({
                        supplierId: item.supplier.id,
                        supplierName: item.supplier.name,
                        priceText: decimalLikeToText(item.price),
                        currency: item.currency ?? "TRY",
                        isActive: Boolean(item.isActive),
                    })),
                    minPrice: (() => {
                        const priced = (variant.variantSuppliers ?? [])
                            .map((item) => ({
                                value: decimalLikeToNumber(item.price),
                                currency: item.currency ?? "TRY",
                            }))
                            .filter((item): item is { value: number; currency: string } => item.value !== null)
                        if (!priced.length) return undefined
                        return priced.reduce((min, cur) => (cur.value < min.value ? cur : min))
                    })(),
                    fullCodes: [variant.fullCode],
                })
                continue
            }

            if (variant.color && !existing.colors.find((color) => color.id === variant.color?.id)) {
                existing.colors.push(variant.color)
            }

            for (const material of variant.materials) {
                if (!existing.materials.find((item) => item.id === material.id)) {
                    existing.materials.push(material)
                }
            }

            for (const supplier of variant.variantSuppliers ?? []) {
                const next = {
                    supplierId: supplier.supplier.id,
                    supplierName: supplier.supplier.name,
                    priceText: decimalLikeToText(supplier.price),
                    currency: supplier.currency ?? "TRY",
                    isActive: Boolean(supplier.isActive),
                }
                const exists = existing.suppliers.find(
                    (item) =>
                        item.supplierId === next.supplierId &&
                        item.priceText === next.priceText &&
                        item.currency === next.currency
                )
                if (!exists) {
                    existing.suppliers.push(next)
                }
            }

            const allPriced = existing.suppliers
                .map((item) => ({
                    value: Number(item.priceText),
                    currency: item.currency,
                }))
                .filter((item) => Number.isFinite(item.value))

            if (allPriced.length > 0) {
                existing.minPrice = allPriced.reduce((min, cur) =>
                    cur.value < min.value ? cur : min
                )
            }

            if (!existing.fullCodes.includes(variant.fullCode)) {
                existing.fullCodes.push(variant.fullCode)
            }
        }

        return Array.from(groups.values()).sort((a, b) => {
            const aFirst = a.measurements[0]?.value ?? 0
            const bFirst = b.measurements[0]?.value ?? 0
            return aFirst - bFirst
        })
    }, [variants])

    const [selectedKey, setSelectedKey] = useState<string>("")

    const isNavigatingToVariant = pendingVariantKey !== null
    // P1.8(B0): tedarikçi verisi yoksa (public + customer-main artık
    // variantSuppliers'sız) Tedarikçi sütununu/rozetini gizle.
    const hasSupplierData = options.some((option) => option.suppliers.length > 0)
    const selected = options.find((option) => option.key === selectedKey) ?? options[0]
    const pendingOption = options.find((option) => option.key === pendingVariantKey)
    const groups: string[] = ((session?.user as { groups?: string[] } | undefined)?.groups) ?? []
    const canManageVariants = groups.includes("owner") || groups.includes("admin")
    const adminVariantsUrl = `/admin/products/${productId}/variants`
    const measurementColumns = useMemo(() => {
        const map = new Map<string, MeasurementTypeDetails>()

        for (const option of options) {
            for (const measurement of option.measurements) {
                map.set(measurement.measurementType.id, measurement.measurementType)
            }
        }

        return Array.from(map.values()).sort((a, b) => a.displayOrder - b.displayOrder)
    }, [options])

    if (!options.length) {
        // P1.8f: fetch hatasında "varyant yok" değil, "yüklenemedi" göster.
        return (
            <div className={cn("text-sm", loadError ? "text-red-600" : "text-neutral-400")}>
                {loadError ? t("loadError") : t("empty")}
            </div>
        )
    }

    return (
        <div
            className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
            aria-busy={isNavigatingToVariant}
            aria-live="polite"
        >
            <AnimatePresence>
                {isNavigatingToVariant ? (
                    <ProductVariantNavigationOverlay measurementLabel={pendingOption?.label} />
                ) : null}
            </AnimatePresence>

            <span className="sr-only" role="status">
                {isNavigatingToVariant
                    ? t("srNavigating")
                    : t("srReady")}
            </span>

            <div className="border-b border-neutral-100 px-6 py-4 bg-neutral-50/50">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-base font-semibold text-neutral-900">{t("title")}</h2>
                        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-neutral-500">
                            {focusOnMeasurements
                                ? t("descFocus")
                                : t("descDefault")}
                        </p>
                    </div>

                    <AnimatePresence initial={false}>
                        {isNavigatingToVariant ? (
                            <motion.div
                                key="variant-nav-status"
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.16, ease: "easeOut" }}
                                className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-brand/10 px-3 py-1.5 text-[11px] font-medium text-brand"
                            >
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                {pendingOption?.label
                                    ? t("navigatingLabel", { label: pendingOption.label })
                                    : t("navigatingGeneric")}
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            </div>

            <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
                <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">{t("optionsTitle")}</p>
                    <div className="relative max-h-[860px] overflow-auto rounded-xl border border-neutral-200 bg-neutral-50/10 shadow-inner">
                        <Table className={cn(
                            focusOnMeasurements ? "min-w-[620px]" : "min-w-[780px]",
                            "[&_td]:px-3 [&_td]:py-2.5 [&_td]:text-xs [&_th]:h-10 [&_th]:px-3 [&_th]:py-2 [&_th]:text-[10px] [&_th]:font-bold [&_th]:tracking-wider [&_th]:uppercase [&_tr]:leading-tight border-separate border-spacing-0"
                        )}>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    {measurementColumns.map((column) => (
                                        <TableHead
                                            key={column.id}
                                            className="sticky top-0 z-20 border-b border-neutral-200 bg-neutral-100 text-neutral-700 shadow-[inset_0_-1px_0_rgba(229,229,229,0.95),0_8px_14px_-12px_rgba(15,23,42,0.32)]"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span>{column.code}</span>
                                                <MeasurementHelpDialogButton
                                                    measurementCode={column.code}
                                                    videoUrl={measurementHelpVideoUrl}
                                                />
                                            </div>
                                        </TableHead>
                                    ))}
                                    {!focusOnMeasurements ? (
                                        <TableHead className="sticky top-0 z-20 border-b border-neutral-200 bg-neutral-100 text-center text-neutral-700 shadow-[inset_0_-1px_0_rgba(229,229,229,0.95),0_8px_14px_-12px_rgba(15,23,42,0.32)]">
                                            {t("colColor")}
                                        </TableHead>
                                    ) : null}
                                    {!focusOnMeasurements ? (
                                        <TableHead className="sticky top-0 z-20 border-b border-neutral-200 bg-neutral-100 text-center text-neutral-700 shadow-[inset_0_-1px_0_rgba(229,229,229,0.95),0_8px_14px_-12px_rgba(15,23,42,0.32)]">
                                            {t("colMaterial")}
                                        </TableHead>
                                    ) : null}
                                    {!focusOnMeasurements && hasSupplierData ? (
                                        <TableHead className="sticky top-0 z-20 border-b border-neutral-200 bg-neutral-100 text-center text-neutral-700 shadow-[inset_0_-1px_0_rgba(229,229,229,0.95),0_8px_14px_-12px_rgba(15,23,42,0.32)]">
                                            {t("colSupplier")}
                                        </TableHead>
                                    ) : null}
                                    {!focusOnMeasurements ? (
                                        <TableHead className="sticky top-0 z-20 border-b border-neutral-200 bg-neutral-100 text-center text-neutral-700 shadow-[inset_0_-1px_0_rgba(229,229,229,0.95),0_8px_14px_-12px_rgba(15,23,42,0.32)]">
                                            {t("colCode")}
                                        </TableHead>
                                    ) : null}
                                    <TableHead className="sticky top-0 z-20 border-b border-neutral-200 bg-neutral-100 text-center text-neutral-700 shadow-[inset_0_-1px_0_rgba(229,229,229,0.95),0_8px_14px_-12px_rgba(15,23,42,0.32)]">
                                        {t("colDetail")}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {options.map((option) => {
                                    const isActive = selected?.key === option.key
                                    const isPending = pendingVariantKey === option.key && isNavigatingToVariant
                                    const variantDetailsHref = {
                                        pathname:
                                            variantDetailsPathname ??
                                            `/urun/${productSlug}/varyantlar`,
                                        query: { m: option.key },
                                    }

                                    return (
                                        <TableRow
                                            key={option.key}
                                            data-state={isActive ? "selected" : undefined}
                                            className={cn(
                                                "cursor-pointer transition-all duration-150 border-b border-neutral-100",
                                                isActive
                                                    ? "bg-brand/[0.04] hover:bg-brand/[0.06] font-medium"
                                                    : "hover:bg-neutral-50/70"
                                            )}
                                            onClick={() => setSelectedKey(option.key)}
                                        >
                                            {measurementColumns.map((column, index) => {
                                                const measurement = option.measurements.find(
                                                    (item) => item.measurementType.id === column.id
                                                )

                                                if (!measurement) {
                                                    return (
                                                        <TableCell
                                                            key={`${option.key}-${column.id}`}
                                                            className={cn(
                                                                "text-neutral-300 text-center font-normal px-3 py-2.5",
                                                                index === 0 && isActive && "border-l-2 border-l-brand"
                                                            )}
                                                        >
                                                            —
                                                        </TableCell>
                                                    )
                                                }

                                                const hasUnit =
                                                    measurement.measurementType.baseUnit &&
                                                    measurement.measurementType.code !== "D" &&
                                                    measurement.measurementType.code !== "M"

                                                return (
                                                    <TableCell
                                                        key={`${option.key}-${column.id}`}
                                                        className={cn(
                                                            "px-3 py-2.5 text-neutral-800",
                                                            index === 0 && isActive
                                                                ? "border-l-2 border-l-brand text-brand font-bold"
                                                                : "font-semibold"
                                                        )}
                                                    >
                                                        {formatMeasurementValue(measurement)}
                                                        {hasUnit ? (
                                                            <span className="text-[10px] text-neutral-400 font-normal ml-0.5">
                                                                {measurement.measurementType.baseUnit}
                                                            </span>
                                                        ) : null}
                                                    </TableCell>
                                                )
                                            })}
                                            {!focusOnMeasurements ? (
                                                <TableCell className="text-center px-3 py-2.5">
                                                    <Badge variant="secondary" className="bg-neutral-100 text-neutral-600 font-medium border-none hover:bg-neutral-100 rounded-md">
                                                        {t("colorCount", { count: option.colors.length })}
                                                    </Badge>
                                                </TableCell>
                                            ) : null}
                                            {!focusOnMeasurements ? (
                                                <TableCell className="text-center px-3 py-2.5">
                                                    <Badge variant="secondary" className="bg-neutral-100 text-neutral-600 font-medium border-none hover:bg-neutral-100 rounded-md">
                                                        {t("materialCount", { count: option.materials.length })}
                                                    </Badge>
                                                </TableCell>
                                            ) : null}
                                            {!focusOnMeasurements && hasSupplierData ? (
                                                <TableCell className="text-center px-3 py-2.5">
                                                    <Badge variant="secondary" className="bg-neutral-100 text-neutral-600 font-medium border-none hover:bg-neutral-100 rounded-md">
                                                        {t("supplierCount", { count: option.suppliers.length })}
                                                    </Badge>
                                                </TableCell>
                                            ) : null}
                                            {!focusOnMeasurements ? (
                                                <TableCell className="text-center px-3 py-2.5 font-mono text-[11px] text-neutral-500">
                                                    {t("codeCount", { count: option.fullCodes.length })}
                                                </TableCell>
                                            ) : null}
                                            <TableCell className="px-3 py-2.5 pr-4 text-right align-middle">
                                                <div className="flex items-center justify-end gap-1.5 leading-none">
                                                    <ButtonShine
                                                        href={variantDetailsHref}
                                                        onClick={(event) => {
                                                            event.stopPropagation()

                                                            if (isModifiedClick(event)) {
                                                                return
                                                            }

                                                            setPendingVariantKey(option.key)
                                                        }}
                                                        /* target="_blank"
                                                        rel="noopener noreferrer" */
                                                        ariaLabel={t("showVariantsAria", { label: option.label })}
                                                        className={cn(
                                                            "h-7 min-w-[132px] rounded-full border border-[var(--color-brand)]/80 bg-[var(--color-brand)] px-2.5 text-[11px] font-medium text-[var(--color-brand-foreground)] shadow-sm shadow-brand/10 transition-all duration-200 hover:border-[var(--color-brand)] hover:bg-white hover:text-[var(--color-brand)] active:scale-95",
                                                            isActive && "ring-2 ring-[var(--color-brand)]/20 ring-offset-1",
                                                            isPending && "cursor-wait"
                                                        )}
                                                    >
                                                        <span className="inline-flex items-center gap-1.5">
                                                            {isPending ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : null}
                                                            {isPending ? t("opening") : t("showVariants")}
                                                        </span>
                                                    </ButtonShine>
                                                    {canManageVariants && adminVariantsUrl && !focusOnMeasurements ? (
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            className="h-7 bg-red-600 px-2.5 text-[11px] text-white hover:bg-red-700 active:scale-95"
                                                            onClick={(e) => e.stopPropagation()}
                                                            disabled={isNavigatingToVariant}
                                                        >
                                                            <Link href={adminVariantsUrl} target="_blank" rel="noopener noreferrer">
                                                                {t("openInAdmin")}
                                                            </Link>
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="space-y-4">
                    {technicalDrawing ? (
                        <div className="w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50/30 p-2.5 shadow-sm">
                            {technicalDrawing}
                        </div>
                    ) : null}

                    {/* Seçilen Ölçü Detayları */}
                    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
                            <div className="flex items-center gap-2 text-neutral-900 font-semibold text-sm">
                                <Ruler className="w-4 h-4 text-brand" />
                                <span>{t("selectedDetailsTitle")}</span>
                            </div>
                            {focusOnMeasurements ? (
                                <div className="flex items-center gap-1.5">
                                    <MeasurementHelpDialogButton
                                        measurementCode="GENEL"
                                        videoUrl={measurementHelpVideoUrl}
                                    />
                                    <span className="text-[10px] text-neutral-400">{t("helpVideo")}</span>
                                </div>
                            ) : null}
                        </div>
                        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                            {selected.measurements.map((measurement) => {
                                const hasUnit =
                                    measurement.measurementType.baseUnit &&
                                    measurement.measurementType.code !== "D" &&
                                    measurement.measurementType.code !== "M"

                                return (
                                    <div
                                        key={measurement.id}
                                        className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-2.5 hover:border-brand/30 transition-all duration-200"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-brand tracking-wider uppercase">
                                                {measurement.measurementType.code}
                                            </span>
                                            <span className="text-xs text-neutral-500 font-medium leading-normal">
                                                {measurement.measurementType.name}
                                            </span>
                                        </div>
                                        <div className="rounded-lg bg-white border border-neutral-200/60 px-3 py-1 text-sm font-bold text-neutral-900 shadow-sm font-mono">
                                            {formatMeasurementValue(measurement)}
                                            {hasUnit ? ` ${measurement.measurementType.baseUnit}` : ""}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Mevcut Varyant Kodları */}
                    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-neutral-900 font-semibold text-sm border-b border-neutral-100 pb-3 mb-3">
                            <Hash className="w-4 h-4 text-brand" />
                            <span>{t("codesTitle")}</span>
                        </div>
                        {selected.fullCodes.length === 0 ? (
                            <p className="text-xs text-neutral-400">{t("codesEmpty")}</p>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {selected.fullCodes.map((fullCode) => (
                                    <Badge
                                        key={fullCode}
                                        variant="outline"
                                        className="font-mono text-xs font-semibold px-2.5 py-1 bg-neutral-50/50 text-neutral-700 hover:bg-neutral-50/50 border-neutral-200/80 rounded-lg shadow-sm"
                                    >
                                        {fullCode}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Renk Seçenekleri */}
                    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-neutral-900 font-semibold text-sm border-b border-neutral-100 pb-3 mb-3">
                            <Palette className="w-4 h-4 text-brand" />
                            <span>{t("colorsTitle")}</span>
                        </div>
                        {selected.colors.length === 0 ? (
                            <p className="text-xs text-neutral-400">{t("colorsEmpty")}</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {selected.colors.map((color) => (
                                    <span
                                        key={color.id}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-100 bg-neutral-50/50 hover:bg-white hover:border-brand/40 hover:shadow-sm text-xs text-neutral-700 font-medium transition-all duration-200"
                                    >
                                        <span
                                            className="w-3.5 h-3.5 rounded-full border border-neutral-200 shadow-inner"
                                            style={{ backgroundColor: color.hex || "#ddd" }}
                                        />
                                        {formatColorLabel(color)}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Ham Madde Seçenekleri */}
                    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-neutral-900 font-semibold text-sm border-b border-neutral-100 pb-3 mb-3">
                            <Layers3 className="w-4 h-4 text-brand" />
                            <span>{t("materialsTitle")}</span>
                        </div>
                        {selected.materials.length === 0 ? (
                            <p className="text-xs text-neutral-400">{t("materialsEmpty")}</p>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {selected.materials.map((material) => (
                                    <Badge
                                        key={material.id}
                                        variant="outline"
                                        className="text-xs font-semibold px-2.5 py-1 bg-brand/5 text-brand border-brand/20 hover:bg-brand/10 rounded-lg"
                                    >
                                        {material.name}
                                        {material.code ? ` (${material.code})` : ""}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
