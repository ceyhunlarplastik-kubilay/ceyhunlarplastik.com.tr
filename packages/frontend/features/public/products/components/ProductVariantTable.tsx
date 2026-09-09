"use client"

import { useId, useMemo, useState, type MouseEvent } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { CircleHelp, Loader2, Hash, ChevronRight, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { parseAsString, useQueryState } from "nuqs"

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
import { ButtonShine } from "@/components/ui/button-shine"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
    formatMeasurementValue,
    resolveMeasurementName,
    resolveMeasurementUnit,
} from "@/features/public/products/utils/measurement"
import type { GroupedMeasurementOption } from "@/features/public/products/utils/groupedMeasurementOption"
import { formatColorLabel } from "@/lib/color/formatColorLabel"
import ProductVariantNavigationOverlay from "@/features/public/products/components/ProductVariantNavigationOverlay"
import type { SupportedLocale } from "@core/i18n/locales"

export type MeasurementTypeDetails = {
    id: string
    name: string
    locale?: SupportedLocale
    resolvedLocale?: string
    translationMissing?: boolean
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
    locale?: SupportedLocale
    resolvedLocale?: string
    translationMissing?: boolean
    system?: string
    code?: string
    hex?: string
}

export type VariantMaterial = {
    id: string
    name: string
    locale?: SupportedLocale
    resolvedLocale?: string
    translationMissing?: boolean
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
    /** "V1" — renk + hammadde kombinasyonu. */
    versionCode: string | null
    /** Kodun 3. segmenti; eski `variantIndex`'in yerini aldı. */
    sizeCode?: number | null
    /** "10.5.8.V1" — tedarikçi harfi içermez. */
    fullCode: string
    measurements: VariantMeasurement[]
    color?: VariantColor | null
    materials: VariantMaterial[]
    variantSuppliers?: VariantSupplier[]
}

interface ProductVariantTableProps {
    // Önceden GRUPLANMIŞ satırlar (satır = ölçü). Gruplama artık SUNUCUDA yapılır
    // (P1.8(d)) — hem tarayıcıya inen payload küçülür hem de sayfalama doğru birime
    // (ölçüye) oturur; eskiden 500 ham varyant sınırı fazlasını sessizce düşürüyordu.
    options: GroupedMeasurementOption[]
    productSlug: string
    technicalDrawing?: React.ReactNode
    productId: string
    variantDetailsPathname?: string
    focusOnMeasurements?: boolean
    measurementHelpVideoUrl?: string
    /**
     * Sağ panel (teknik resim) yalnız görsel gösterdiğinde dar kalabiliyor;
     * bu sayfalarda tabloya daha fazla yer ayırmak için kullanılır.
     */
    wideTable?: boolean
    // P1.8f: veri fetch'i BAŞARISIZ olduğunda true. Boş varyant listesi "varyant
    // yok" değil "yüklenemedi" olarak gösterilsin diye — yanıltıcı empty state'i
    // hata state'inden ayırır.
    loadError?: boolean
}

function MeasurementHelpDialogButton({
    measurementCode,
    videoUrl,
    quiet = false,
}: {
    measurementCode: string
    videoUrl: string
    quiet?: boolean
}) {
    const t = useTranslations("public.productVariant.help")
    const reduceMotion = useReducedMotion()
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    type="button"
                    aria-label={t("videoAria", { code: measurementCode })}
                    className="relative inline-flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={(event) => event.stopPropagation()}
                >
                    {!quiet ? <motion.span
                        className="absolute inset-0 rounded-full bg-brand/15"
                        animate={reduceMotion ? undefined : {
                            scale: [1, 1.55, 1],
                            opacity: [0.25, 0.75, 0.25],
                        }}
                        transition={{
                            duration: 1.8,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    /> : null}
                    {!quiet ? <motion.span
                        className="absolute inset-0 rounded-full border border-brand/40"
                        animate={reduceMotion ? undefined : {
                            scale: [1, 1.85],
                            opacity: [0.55, 0],
                        }}
                        transition={{
                            duration: 1.9,
                            repeat: Infinity,
                            ease: "easeOut",
                        }}
                    /> : null}
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

function isModifiedClick(event: MouseEvent) {
    return (
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.button !== 0
    )
}

// Renk kolonunda üst üste binen rozetler ekrana sığmalı; kalanlar "+N" ile
// kırpılır (bkz. avatar.tsx AvatarGroup/AvatarGroupCount). Ham madde daha az
// gösterir: isim genelde renkten uzun, kolon genişlemesin diye.
const MAX_VISIBLE_COLORS = 3
const MAX_VISIBLE_MATERIALS = 2

/**
 * `material.code` zaten kısa bir iş kodu (PP, PVC, ABS gibi — bkz. schema.prisma
 * Material.code), olduğu gibi gösterilir. Kod yoksa harf kısaltması ANLAŞILMAZ
 * çıkıyordu ("Bakalit Amyantsız" → "BA" görüldüğünde ne olduğu anlaşılmıyor) —
 * bunun yerine tam isim yazılır; sığdırma CSS `truncate` ile yapılır (bkz.
 * kullanım yeri), tam metin `title` tooltip'inde kalır.
 */
function materialShortLabel(material: VariantMaterial) {
    if (material.code?.trim()) return material.code.trim().toUpperCase()
    return material.name.trim()
}

export default function ProductVariantTable({
    options,
    productSlug,
    technicalDrawing,
    productId,
    variantDetailsPathname,
    focusOnMeasurements = false,
    measurementHelpVideoUrl = "https://www.youtube.com/embed/42mrTRiExjs?autoplay=1",
    loadError = false,
    wideTable = false,
}: ProductVariantTableProps) {
    const t = useTranslations("public.productVariant.table")
    const titleId = useId()
    const reduceMotion = useReducedMotion()
    const { data: session } = useSession()
    const [pendingVariantKey, setPendingVariantKey] = useState<string | null>(null)
    const [selectedKey, setSelectedKey] = useQueryState(
        "m",
        parseAsString.withOptions({ history: "replace", shallow: true }),
    )

    const isNavigatingToVariant = pendingVariantKey !== null
    const selected = options.find((option) => option.key === selectedKey) ?? options[0]
    const pendingOption = options.find((option) => option.key === pendingVariantKey)
    const groups: string[] = ((session?.user as { groups?: string[] } | undefined)?.groups) ?? []
    const canManageVariants = groups.includes("owner") || groups.includes("admin")
    const adminVariantsUrl = `/admin/products/${productId}/variants`
    // Kolon başlığı ürün modeline ÖZEL adı gösterir ("Elcik Çapı"), ölçü tipinin
    // genel adını değil: aynı `R` kodu başka bir modelde "Kol Çapı" olabilir.
    const measurementColumns = useMemo(() => {
        const map = new Map<string, {
            id: string
            code: string
            name: string
            displayOrder: number
        }>()

        for (const option of options) {
            for (const measurement of option.measurements) {
                const type = measurement.measurementType
                if (!type || map.has(type.id)) continue

                map.set(type.id, {
                    id: type.id,
                    code: type.code,
                    name: resolveMeasurementName(measurement),
                    displayOrder: type.displayOrder,
                })
            }
        }

        return Array.from(map.values()).sort((a, b) => a.displayOrder - b.displayOrder)
    }, [options])

    if (!options.length) {
        // P1.8f: fetch hatasında "varyant yok" değil, "yüklenemedi" göster.
        return (
            <div className={cn("text-sm", loadError ? "text-destructive" : "text-muted-foreground")}>
                {loadError ? t("loadError") : t("empty")}
            </div>
        )
    }

    return (
        <div
            className={cn(
                "relative min-w-0",
                wideTable
                    ? "flex flex-col gap-5"
                    : "overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            )}
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

            {wideTable || isNavigatingToVariant ? (
                <div className={cn(
                    "flex flex-wrap items-start justify-end gap-3",
                    !wideTable && "border-b border-border bg-muted/50 px-6 py-4"
                )}>
                    {/* Boş `wideTable` durumunda bu sarmalayıcı bilerek MONTE
                        kalır (aksi halde AnimatePresence exit animasyonu oynamadan
                        `isNavigatingToVariant` false olur olmaz tüm blok söküldüğü
                        için rozet aniden kaybolurdu). */}
                    <AnimatePresence initial={false}>
                        {isNavigatingToVariant ? (
                            <motion.div
                                key="variant-nav-status"
                                initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                                transition={{ duration: reduceMotion ? 0 : 0.16, ease: "easeOut" }}
                                className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground"
                            >
                                <Loader2 className="size-3.5 motion-safe:animate-spin" />
                                {pendingOption?.label
                                    ? t("navigatingLabel", { label: pendingOption.label })
                                    : t("navigatingGeneric")}
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            ) : null}

            <div className={cn(
                "grid min-w-0 items-start gap-5",
                wideTable
                    ? "lg:grid-cols-[minmax(0,1.9fr)_minmax(260px,1fr)]"
                    : "p-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]"
            )}>
                <div className="min-w-0">
                    {/* Table's own container owns both scroll axes so sticky headings
                        remain attached to the vertical viewport, including on mobile. */}
                    <div
                        role="region"
                        aria-labelledby={wideTable ? titleId : undefined}
                        aria-label={wideTable ? undefined : t("title")}
                        className={cn(
                            "overflow-hidden rounded-xl border border-border bg-card *:data-[slot=table-container]:overflow-auto",
                            wideTable
                                ? "*:data-[slot=table-container]:max-h-[min(34rem,70dvh)]"
                                : "*:data-[slot=table-container]:max-h-215"
                        )}
                    >
                        {wideTable ? (
                            <h2
                                id={titleId}
                                className="border-b border-border bg-muted/40 px-4 py-3 text-center text-xl font-semibold tracking-tight text-foreground sm:px-5 sm:text-2xl"
                            >
                                {t("title")}
                            </h2>
                        ) : null}
                        <Table className={cn(
                            "border-separate border-spacing-0 [&_th]:px-3 [&_th]:font-semibold [&_tr]:leading-snug",
                            wideTable
                                ? "min-w-140 [&_td]:px-3 [&_td]:py-2.5 [&_td]:text-sm [&_th]:h-14 [&_th]:py-2.5 [&_th]:text-xs"
                                : "min-w-155 [&_td]:px-2.5 [&_td]:py-2 [&_td]:text-[11px] [&_th]:h-9 [&_th]:py-1.5 [&_th]:text-[9.5px] [&_th]:tracking-wider [&_th]:uppercase"
                        )}>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    {measurementColumns.map((column) => (
                                        <TableHead
                                            key={column.id}
                                            className="sticky top-0 z-10 border-b border-border bg-muted text-center text-foreground"
                                        >
                                            <div className="flex flex-col items-center gap-0.5">
                                                <span className="min-w-20 whitespace-normal leading-snug">{column.name}</span>
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <span className={cn("font-mono font-normal", wideTable ? "text-xs" : "text-[9px]")}>
                                                        {column.code}
                                                    </span>
                                                    <MeasurementHelpDialogButton
                                                        measurementCode={column.code}
                                                        videoUrl={measurementHelpVideoUrl}
                                                        quiet={wideTable}
                                                    />
                                                </span>
                                            </div>
                                        </TableHead>
                                    ))}
                                    {!focusOnMeasurements ? (
                                        <TableHead className="sticky top-0 z-10 border-b border-border bg-muted text-center text-foreground">
                                            {t("colColor")}
                                        </TableHead>
                                    ) : null}
                                    {!focusOnMeasurements ? (
                                        <TableHead className="sticky top-0 z-10 border-b border-border bg-muted text-center text-foreground">
                                            {t("colMaterial")}
                                        </TableHead>
                                    ) : null}
                                    <TableHead className="sticky top-0 z-10 w-12 border-b border-border bg-muted text-center text-foreground">
                                        <span className="sr-only">{t("colDetail")}</span>
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
                                            tabIndex={0}
                                            className={cn(
                                                "group cursor-pointer border-b border-border transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                                                isActive
                                                    ? "bg-brand/10 font-medium hover:bg-brand/15 data-[state=selected]:bg-brand/10"
                                                    : "hover:bg-muted/50"
                                            )}
                                            onClick={() => setSelectedKey(option.key)}
                                            onKeyDown={(event) => {
                                                if (event.target !== event.currentTarget) return
                                                if (event.key === "Enter" || event.key === " ") {
                                                    event.preventDefault()
                                                    void setSelectedKey(option.key)
                                                }
                                            }}
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
                                                                "text-muted-foreground text-center font-normal px-3 py-2.5",
                                                                index === 0 && isActive && "border-s-2 border-s-brand"
                                                            )}
                                                        >
                                                            -
                                                        </TableCell>
                                                    )
                                                }

                                                // Metrik dişte birim gösterilmez ("M4 mm" anlamsız).
                                                const unit = resolveMeasurementUnit(measurement)

                                                return (
                                                    <TableCell
                                                        key={`${option.key}-${column.id}`}
                                                        className={cn(
                                                            "px-3 py-2.5 text-center text-foreground tabular-nums",
                                                            index === 0 && isActive
                                                                ? "border-s-2 border-s-brand font-bold"
                                                                : "font-semibold"
                                                        )}
                                                    >
                                                        {formatMeasurementValue(measurement)}
                                                        {unit ? (
                                                            <span className={cn("ms-1 font-normal text-muted-foreground", wideTable ? "text-xs" : "text-[10px]")}>
                                                                {unit}
                                                            </span>
                                                        ) : null}
                                                    </TableCell>
                                                )
                                            })}
                                            {!focusOnMeasurements ? (
                                                <TableCell className="text-center px-2.5 py-2">
                                                    {option.colors.length === 0 ? (
                                                        <span className="text-muted-foreground">-</span>
                                                    ) : (
                                                        <AvatarGroup className="justify-center">
                                                            {option.colors.slice(0, MAX_VISIBLE_COLORS).map((color) => (
                                                                <Avatar key={color.id} size="sm" title={formatColorLabel(color)}>
                                                                    <AvatarFallback
                                                                        style={{ backgroundColor: color.hex || "#d4d4d4" }}
                                                                    />
                                                                </Avatar>
                                                            ))}
                                                            {option.colors.length > MAX_VISIBLE_COLORS ? (
                                                                <AvatarGroupCount
                                                                    title={option.colors
                                                                        .slice(MAX_VISIBLE_COLORS)
                                                                        .map((color) => formatColorLabel(color))
                                                                        .join(", ")}
                                                                >
                                                                    +{option.colors.length - MAX_VISIBLE_COLORS}
                                                                </AvatarGroupCount>
                                                            ) : null}
                                                        </AvatarGroup>
                                                    )}
                                                </TableCell>
                                            ) : null}
                                            {!focusOnMeasurements ? (
                                                <TableCell className="px-2.5 py-2 text-center">
                                                    {option.materials.length === 0 ? (
                                                        <span className="text-muted-foreground">-</span>
                                                    ) : (
                                                        <div className="flex flex-nowrap items-center justify-center gap-1">
                                                            {option.materials.slice(0, MAX_VISIBLE_MATERIALS).map((material) => (
                                                                <Badge
                                                                    key={material.id}
                                                                    title={material.name}
                                                                    variant="secondary"
                                                                    className={cn("min-w-0", wideTable ? "max-w-28" : "max-w-20")}
                                                                >
                                                                    <span className="truncate">{materialShortLabel(material)}</span>
                                                                </Badge>
                                                            ))}
                                                            {option.materials.length > MAX_VISIBLE_MATERIALS ? (
                                                                <Badge
                                                                    variant="secondary"
                                                                    title={option.materials
                                                                        .slice(MAX_VISIBLE_MATERIALS)
                                                                        .map((material) => material.name)
                                                                        .join(", ")}
                                                                >
                                                                    +{option.materials.length - MAX_VISIBLE_MATERIALS}
                                                                </Badge>
                                                            ) : null}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            ) : null}
                                            <TableCell className="px-2 py-2 pe-3 text-end align-middle">
                                                <div className="flex items-center justify-end gap-1">
                                                    <ButtonShine
                                                        href={variantDetailsHref}
                                                        onClick={(event) => {
                                                            event.stopPropagation()

                                                            if (isModifiedClick(event)) {
                                                                return
                                                            }

                                                            setPendingVariantKey(option.key)
                                                        }}
                                                        ariaLabel={isPending ? t("opening") : t("showVariantsAria", { label: option.label })}
                                                        className={cn(
                                                            "shrink-0 rounded-full border border-border p-0 shadow-none motion-safe:transition-transform motion-safe:duration-150 motion-safe:hover:scale-105",
                                                            wideTable ? "size-8 text-white hover:text-neutral-950" : "size-7",
                                                            isPending && "cursor-wait"
                                                        )}
                                                    >
                                                        {isPending ? (
                                                            <Loader2 className="size-3.5 motion-safe:animate-spin" />
                                                        ) : (
                                                            <ChevronRight className="h-3.5 w-3.5" />
                                                        )}
                                                    </ButtonShine>
                                                    {canManageVariants && adminVariantsUrl && !focusOnMeasurements ? (
                                                        <Button
                                                            asChild
                                                            size="icon-xs"
                                                            variant="ghost"
                                                            className="shrink-0 rounded-full"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Link
                                                                href={adminVariantsUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                aria-label={t("openInAdmin")}
                                                            >
                                                                <ExternalLink className="h-3.5 w-3.5" />
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

                <div className="flex min-w-0 flex-col gap-4">
                    {technicalDrawing ? (
                        <div className={cn(
                            "w-full overflow-hidden",
                            !wideTable && "rounded-xl border border-border bg-muted/30 p-2.5 shadow-sm"
                        )}>
                            {technicalDrawing}
                        </div>
                    ) : null}

                    {/* Mevcut Varyant Kodları */}
                    <div className={cn(
                        "flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card",
                        wideTable ? "p-3 sm:p-4" : "p-4 shadow-sm"
                    )}>
                        <div className="flex flex-col gap-1.5">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Hash className="size-4 text-muted-foreground" />
                                {t("codesTitle")}
                            </h3>
                            {wideTable ? (
                                <p className="text-xs leading-relaxed text-muted-foreground">{selected.label}</p>
                            ) : null}
                        </div>
                        {selected.variants.length === 0 ? (
                            <p className="text-xs text-muted-foreground">{t("codesEmpty")}</p>
                        ) : (
                            <div className="min-w-0 overflow-hidden rounded-lg border border-border *:data-[slot=table-container]:max-h-72 *:data-[slot=table-container]:overflow-auto">
                                <Table className={cn(
                                    "border-separate border-spacing-0 [&_td]:px-2.5 [&_td]:py-2 [&_th]:h-8 [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:font-medium",
                                    wideTable ? "[&_td]:text-xs [&_th]:text-xs" : "[&_td]:text-[11px] [&_th]:text-[9px] [&_th]:tracking-wider [&_th]:uppercase"
                                )}>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="sticky top-0 z-10 border-b border-border bg-muted text-foreground">
                                                {t("colCode")}
                                            </TableHead>
                                            <TableHead className="sticky top-0 z-10 border-b border-border bg-muted text-foreground">
                                                {t("colColor")}
                                            </TableHead>
                                            <TableHead className="sticky top-0 z-10 border-b border-border bg-muted text-foreground">
                                                {t("colMaterial")}
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selected.variants.map((variant) => {
                                            const color = variant.colorId
                                                ? selected.colors.find((entry) => entry?.id === variant.colorId)
                                                : null
                                            const materialNames = variant.materialIds
                                                .map((materialId) => selected.materials.find((entry) => entry?.id === materialId)?.name)
                                                .filter((name): name is string => Boolean(name))

                                            return (
                                                <TableRow key={variant.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                                                    <TableCell className="font-mono font-semibold text-foreground">
                                                        {variant.fullCode}
                                                    </TableCell>
                                                    <TableCell>
                                                        {color ? (
                                                            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                                                <span
                                                                    className="size-2.5 shrink-0 rounded-full border border-border"
                                                                    style={{ backgroundColor: color.hex || "#ddd" }}
                                                                />
                                                                {formatColorLabel(color)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="whitespace-normal text-muted-foreground">
                                                        {materialNames.length > 0 ? materialNames.join(", ") : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
