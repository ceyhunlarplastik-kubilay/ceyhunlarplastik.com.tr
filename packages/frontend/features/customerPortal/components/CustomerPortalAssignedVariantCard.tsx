"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Heart, UserRoundCog } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CustomerAssignedProduct } from "@/features/admin/customers/api/types"
import {
    buildMeasurementKey,
    formatMeasurementValue,
    resolveMeasurementName,
    resolveMeasurementUnit,
} from "@/features/public/products/utils/measurement"
import { formatColorLabel } from "@/lib/color/formatColorLabel"
import { getAssignedProductVariantImageUrl } from "@/lib/customers/assignedProductVariants"
import { PortalFavoriteVariantButton } from "@/features/customerPortal/components/PortalFavoriteVariantButton"
import {
    usePortalFavoriteVariantIds,
    usePortalFavoriteVariants,
} from "@/features/customerPortal/hooks/usePortalFavoriteVariant"

type Props = {
    item: CustomerAssignedProduct
}

function normalizeMeasurementKeyInput(measurement: NonNullable<CustomerAssignedProduct["productVariant"]["measurements"]>[number]) {
    return {
        ...measurement,
        measurementType: {
            ...measurement.measurementType,
            baseUnit: measurement.measurementType.baseUnit ?? "",
            displayOrder: measurement.measurementType.displayOrder ?? 0,
        },
    }
}

function formatMeasurementPill(measurement: NonNullable<CustomerAssignedProduct["productVariant"]["measurements"]>[number]) {
    const normalized = normalizeMeasurementKeyInput(measurement)
    const unit = resolveMeasurementUnit(normalized)
    const withUnit = unit ? ` ${unit}` : ""

    // Ad ürün modeline özeldir ("Burç Metriği"); kod yalnız ikincil ipucu.
    return `${resolveMeasurementName(normalized)}: ${formatMeasurementValue(normalized)}${withUnit}`
}

function buildVariantHref(item: CustomerAssignedProduct) {
    const product = item.productVariant.product
    if (!product?.slug) return null

    const measurements = item.productVariant.measurements ?? []
    if (measurements.length === 0) {
        return `/musteri/tum-urunler/urun/${product.slug}/varyantlar`
    }

    const measurementKey = buildMeasurementKey(measurements.map(normalizeMeasurementKeyInput))
    return `/musteri/tum-urunler/urun/${product.slug}/varyantlar?m=${encodeURIComponent(measurementKey)}`
}

function formatAddedBy(item: CustomerAssignedProduct) {
    const user = item.createdByUser
    if (!user) return null

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
    return fullName || user.identifier || user.email || null
}

/**
 * Kaynağı görünür kılar: temsilci ataması mı, müşterinin kendi favorisi mi.
 * Ekleyen kişi adı yalnız temsilci atamasında anlamlı — kendi favorisinde
 * müşteri zaten kendisidir.
 */
function SourceBadge({ item }: Props) {
    if (item.source === "CUSTOMER") {
        return (
            <Badge variant="secondary" className="gap-1.5 bg-rose-50 text-rose-700">
                <Heart className="h-3.5 w-3.5 fill-current" />
                Favorim
            </Badge>
        )
    }

    const addedBy = formatAddedBy(item)

    return (
        <Badge variant="secondary" className="gap-1.5">
            <UserRoundCog className="h-3.5 w-3.5" />
            {addedBy ? `Temsilci · ${addedBy}` : "Temsilci Seçimi"}
        </Badge>
    )
}

export function CustomerPortalAssignedVariantCard({ item }: Props) {
    const favoriteVariantIds = usePortalFavoriteVariantIds()
    const { toggleFavorite, pendingVariantId } = usePortalFavoriteVariants()
    // Temsilci ataması olan bir satırda da kalp boş olabilir: müşteri onu ayrıca
    // kendi favorisine alabilir, kaldırma yalnız kendi kaydını siler.
    const isFavorite = favoriteVariantIds.has(item.productVariantId)
    const product = item.productVariant.product
    const categoryName = product?.category?.name ?? "Kategori"
    const color = item.productVariant.color
    const materials = item.productVariant.materials ?? []
    const measurements = item.productVariant.measurements ?? []
    const variantHref = buildVariantHref(item)
    const visibleMeasurements = measurements.slice(0, 3)
    const extraMeasurementCount = Math.max(measurements.length - visibleMeasurements.length, 0)
    const visibleMaterials = materials.slice(0, 2)
    const extraMaterialCount = Math.max(materials.length - visibleMaterials.length, 0)

    return (
        <article className="grid gap-3 overflow-hidden rounded-[26px] border border-neutral-200 bg-white p-3.5 shadow-sm transition hover:border-neutral-300 hover:shadow-md">
            <div className="flex items-start gap-3">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[22px] border border-neutral-200 bg-neutral-50">
                    <Image
                        src={getAssignedProductVariantImageUrl(item.productVariant)}
                        alt={product?.name ?? item.productVariant.name}
                        fill
                        sizes="96px"
                        className="object-contain p-3"
                    />
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <SourceBadge item={item} />
                        <Badge variant="outline" className="border-neutral-200 bg-neutral-50 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                            {categoryName}
                        </Badge>
                    </div>

                    <div className="space-y-1">
                        <div className="font-mono text-[11px] font-semibold tracking-[0.08em] text-neutral-500">
                            {item.productVariant.fullCode}
                        </div>
                        <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-neutral-950">
                            {product?.name ?? item.productVariant.name}
                        </h2>
                        <p className="line-clamp-1 text-xs text-neutral-500">
                            {product?.code ?? "-"} {item.productVariant.name ? `· ${item.productVariant.name}` : ""}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-2 rounded-[22px] border border-neutral-200 bg-neutral-50/80 p-3">
                <div className="grid gap-1">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                        Ölçü
                    </div>
                    {visibleMeasurements.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {visibleMeasurements.map((measurement) => (
                                <span
                                    key={measurement.id}
                                    className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700"
                                >
                                    {formatMeasurementPill(measurement)}
                                </span>
                            ))}
                            {extraMeasurementCount > 0 ? (
                                <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-500">
                                    +{extraMeasurementCount}
                                </span>
                            ) : null}
                        </div>
                    ) : (
                        <div className="text-xs text-neutral-400">Ölçü bilgisi yok</div>
                    )}
                </div>

                <div className="grid grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-2">
                    <div className="min-w-0 rounded-2xl border border-neutral-200 bg-white px-3 py-2">
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                            Renk
                        </div>
                        {color ? (
                            <div className="inline-flex max-w-full items-center gap-2 text-xs font-medium text-neutral-700">
                                <span
                                    className="h-3.5 w-3.5 shrink-0 rounded-full border border-neutral-300"
                                    style={{ backgroundColor: color.hex || "#d4d4d8" }}
                                />
                                <span className="truncate">{formatColorLabel(color)}</span>
                            </div>
                        ) : (
                            <div className="text-xs text-neutral-400">Renk yok</div>
                        )}
                    </div>

                    <div className="min-w-0 rounded-2xl border border-neutral-200 bg-white px-3 py-2">
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                            Hammadde
                        </div>
                        {visibleMaterials.length > 0 ? (
                            <div className="line-clamp-2 text-xs leading-5 text-neutral-700">
                                {visibleMaterials.map((material) => material.name).join(", ")}
                                {extraMaterialCount > 0 ? ` +${extraMaterialCount}` : ""}
                            </div>
                        ) : (
                            <div className="text-xs text-neutral-400">Hammadde yok</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {variantHref ? (
                    <Button asChild variant="outline" className="h-10 min-w-0 flex-1 justify-between rounded-2xl border-neutral-200 bg-white text-sm font-medium">
                        <Link href={variantHref}>
                            Varyantları İncele
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                ) : null}

                <PortalFavoriteVariantButton
                    isFavorite={isFavorite}
                    isPending={pendingVariantId === item.productVariantId}
                    onToggle={() => toggleFavorite(item.productVariantId, !isFavorite)}
                    variant={variantHref ? "icon" : "labeled"}
                    className={variantHref ? "h-10 w-10 shrink-0 border border-neutral-200 bg-white" : "h-10 w-full justify-center rounded-2xl border border-neutral-200 bg-white"}
                />
            </div>
        </article>
    )
}
