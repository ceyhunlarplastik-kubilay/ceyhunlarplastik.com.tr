"use client"

import { useMemo, useState } from "react"
import { Palette, Ruler, Layers3, Hash } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"

import { Badge } from "@/components/ui/badge"
import { ButtonShine } from "@/components/ui/button-shine"
import { Button } from "@/components/ui/button"
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
}

export type VariantSupplier = {
    id: string
    isActive?: boolean
    currency?: string | null
    price?: number | string | { s?: number; e?: number; d?: number[] } | null
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

export default function ProductVariantTable({
    variants,
    productSlug,
    technicalDrawing,
    productId,
}: ProductVariantTableProps) {
    const { data: session } = useSession()
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

    const selected = options.find((option) => option.key === selectedKey) ?? options[0]
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
        return (
            <div className="text-neutral-400 text-sm">
                Ölçü bilgisi bulunamadı.
            </div>
        )
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-100 px-4 py-3">
                <h2 className="text-base font-semibold text-neutral-900">Ölçü ve Seçenekler</h2>
                <p className="mt-1 text-xs text-neutral-500">
                    Ölçüler tekilleştirilmiştir. Bir ölçü seçtiğinizde o ölçüye ait renk ve ham madde seçeneklerini görebilirsiniz.
                </p>
            </div>

            <div className="grid gap-3 p-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(260px,1fr)]">
                <div className="space-y-1.5">
                    <p className="text-xs font-medium text-neutral-500">Ölçü Seçenekleri</p>
                    <div className="max-h-[860px] overflow-x-auto overflow-y-auto rounded-lg border border-neutral-200">
                        <Table className="min-w-[760px] [&_td]:px-1.5 [&_td]:py-1 [&_td]:text-xs [&_th]:h-7 [&_th]:px-1.5 [&_th]:py-1 [&_th]:text-[11px] [&_tr]:leading-tight">
                            <TableHeader className="sticky top-0 z-20 bg-neutral-50">
                                <TableRow>
                                    {measurementColumns.map((column) => (
                                        <TableHead key={column.id} className="sticky top-0 z-20 bg-neutral-50 font-semibold">
                                            {column.code}
                                        </TableHead>
                                    ))}
                                    <TableHead className="sticky top-0 z-20 bg-neutral-50 text-center font-semibold">Renk</TableHead>
                                    <TableHead className="sticky top-0 z-20 bg-neutral-50 text-center font-semibold">Ham Madde</TableHead>
                                    <TableHead className="sticky top-0 z-20 bg-neutral-50 text-center font-semibold">Tedarikçi</TableHead>
                                    {/* <TableHead className="text-center">Fiyat</TableHead> */}
                                    <TableHead className="sticky top-0 z-20 bg-neutral-50 text-center font-semibold">Kod</TableHead>
                                    <TableHead className="sticky top-0 z-20 bg-neutral-50 px-1 text-right font-semibold">Detay</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {options.map((option) => {
                                    const isActive = selected?.key === option.key

                                    return (
                                        <TableRow
                                            key={option.key}
                                            data-state={isActive ? "selected" : undefined}
                                            className="cursor-pointer"
                                            onClick={() => setSelectedKey(option.key)}
                                        >
                                            {measurementColumns.map((column) => {
                                                const measurement = option.measurements.find(
                                                    (item) => item.measurementType.id === column.id
                                                )

                                                if (!measurement) {
                                                    return (
                                                        <TableCell
                                                            key={`${option.key}-${column.id}`}
                                                            className="text-neutral-300"
                                                        >
                                                            -
                                                        </TableCell>
                                                    )
                                                }

                                                const hasUnit =
                                                    measurement.measurementType.baseUnit &&
                                                    measurement.measurementType.code !== "D" &&
                                                    measurement.measurementType.code !== "M"

                                                return (
                                                    <TableCell key={`${option.key}-${column.id}`} className="font-medium text-neutral-800">
                                                        {formatMeasurementValue(measurement)}
                                                        {hasUnit ? ` ${measurement.measurementType.baseUnit}` : ""}
                                                    </TableCell>
                                                )
                                            })}
                                            <TableCell className="text-center">{option.colors.length}</TableCell>
                                            <TableCell className="text-center">{option.materials.length}</TableCell>
                                            <TableCell className="text-center">{option.suppliers.length}</TableCell>
                                            {/* <TableCell className="text-center">
                                                {option.minPrice
                                                    ? `${option.minPrice.value.toFixed(2)} ${option.minPrice.currency}`
                                                    : "-"}
                                            </TableCell> */}
                                            <TableCell className="text-center">{option.fullCodes.length}</TableCell>
                                            {/* <TableCell className="px-1 text-right"> */}
                                            <TableCell className="px-0 pr-1 text-right align-middle">
                                                {/* <div className="flex items-center justify-end gap-0.5"> */}
                                                <div className="flex items-center justify-end gap-0.5 leading-none">
                                                    <ButtonShine
                                                        href={{
                                                            pathname: `/urun/${productSlug}/varyantlar`,
                                                            query: { m: option.key },
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="h-6 px-1.5 text-[10px]"
                                                    /* className="h-6 px-1 text-[10px]" */
                                                    >
                                                        Varyantları Göster
                                                    </ButtonShine>
                                                    {canManageVariants && adminVariantsUrl ? (
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            className="h-6 bg-red-600 px-1.5 text-[10px] text-white hover:bg-red-700"
                                                            /* className="h-6 px-1 text-[10px]" */
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Link href={adminVariantsUrl} target="_blank" rel="noopener noreferrer">
                                                                Adminde Aç
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

                <div className="space-y-3">
                    {technicalDrawing ? (
                        <div className="w-full overflow-hidden rounded-lg border border-neutral-200 p-2">
                            {technicalDrawing}
                        </div>
                    ) : null}

                    <div className="rounded-xl border border-neutral-200 p-4">
                        <div className="flex items-center gap-2 text-neutral-700 mb-3">
                            <Ruler className="w-4 h-4" />
                            <p className="text-sm font-medium">Seçilen Ölçü</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {selected.measurements.map((measurement) => (
                                <Badge key={measurement.id} variant="secondary">
                                    {measurement.measurementType.name} ({measurement.measurementType.code}):{" "}
                                    {formatMeasurementValue(measurement)}
                                    {measurement.measurementType.baseUnit &&
                                        measurement.measurementType.code !== "D" &&
                                        measurement.measurementType.code !== "M"
                                        ? ` ${measurement.measurementType.baseUnit}`
                                        : ""}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* <div className="rounded-xl border border-neutral-200 p-4">
                        <div className="flex items-center gap-2 text-neutral-700 mb-3">
                            <Hash className="w-4 h-4" />
                            <p className="text-sm font-medium">Tedarikçi Fiyatları</p>
                        </div>

                        {selected.suppliers.length === 0 ? (
                            <p className="text-sm text-neutral-400">Bu ölçü için tedarikçi fiyat bilgisi bulunamadı.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {selected.suppliers.map((item) => (
                                    <Badge key={`${item.supplierId}-${item.priceText}-${item.currency}`} variant="outline">
                                        {item.supplierName}: {item.priceText || "-"} {item.currency}
                                        {item.isActive ? " (aktif)" : ""}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div> */}

                    <div className="rounded-xl border border-neutral-200 p-4">
                        <div className="flex items-center gap-2 text-neutral-700 mb-3">
                            <Hash className="w-4 h-4" />
                            <p className="text-sm font-medium">Mevcut Varyant Kodları</p>
                        </div>

                        {selected.fullCodes.length === 0 ? (
                            <p className="text-sm text-neutral-400">Bu ölçü için varyant kodu bulunamadı.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {selected.fullCodes.map((fullCode) => (
                                    <Badge key={fullCode} variant="outline" className="font-mono">
                                        {fullCode}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-neutral-200 p-4">
                        <div className="flex items-center gap-2 text-neutral-700 mb-3">
                            <Palette className="w-4 h-4" />
                            <p className="text-sm font-medium">Renk Seçenekleri</p>
                        </div>

                        {selected.colors.length === 0 ? (
                            <p className="text-sm text-neutral-400">Bu ölçü için renk bilgisi bulunamadı.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {selected.colors.map((color) => (
                                    <span
                                        key={color.id}
                                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-neutral-200 text-xs text-neutral-700"
                                    >
                                        <span
                                            className="w-3 h-3 rounded-full border border-neutral-300"
                                            style={{ backgroundColor: color.hex || "#ddd" }}
                                        />
                                        {formatColorLabel(color)}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-neutral-200 p-4">
                        <div className="flex items-center gap-2 text-neutral-700 mb-3">
                            <Layers3 className="w-4 h-4" />
                            <p className="text-sm font-medium">Ham Madde Seçenekleri</p>
                        </div>

                        {selected.materials.length === 0 ? (
                            <p className="text-sm text-neutral-400">Bu ölçü için ham madde bilgisi bulunamadı.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {selected.materials.map((material) => (
                                    <Badge key={material.id} variant="outline">
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
