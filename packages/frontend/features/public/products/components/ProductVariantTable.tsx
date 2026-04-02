"use client"

import { useMemo, useState } from "react"
import { Palette, Ruler, Layers3, Hash } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { ButtonShine } from "@/components/ui/button-shine"
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

export type VariantTableData = {
    id: string
    name: string
    versionCode: string
    fullCode: string
    measurements: VariantMeasurement[]
    color?: VariantColor | null
    materials: VariantMaterial[]
}

type GroupedMeasurementOption = {
    key: string
    label: string
    measurements: VariantMeasurement[]
    colors: VariantColor[]
    materials: VariantMaterial[]
    fullCodes: string[]
}

interface ProductVariantTableProps {
    variants: VariantTableData[]
    productSlug: string
}

export default function ProductVariantTable({ variants, productSlug }: ProductVariantTableProps) {
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
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-neutral-100 px-5 py-4">
                <h2 className="text-lg font-semibold text-neutral-900">Ölçü ve Seçenekler</h2>
                <p className="text-sm text-neutral-500 mt-1">
                    Ölçüler tekilleştirilmiştir. Bir ölçü seçtiğinizde o ölçüye ait renk ve ham madde seçeneklerini görebilirsiniz.
                </p>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[1.3fr_1fr]">
                <div className="space-y-2">
                    <p className="text-xs font-medium text-neutral-500">Ölçü Seçenekleri</p>
                    <div className="max-h-[420px] overflow-auto rounded-xl border border-neutral-200">
                        <Table>
                            <TableHeader className="sticky top-0 bg-neutral-50 z-10">
                                <TableRow>
                                    {measurementColumns.map((column) => (
                                        <TableHead key={column.id}>
                                            {column.code}
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-center">Renk</TableHead>
                                    <TableHead className="text-center">Ham Madde</TableHead>
                                    <TableHead className="text-center">Kod</TableHead>
                                    <TableHead className="text-right pr-4">Detay</TableHead>
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
                                                    <TableCell key={`${option.key}-${column.id}`} className="font-medium">
                                                        {formatMeasurementValue(measurement)}
                                                        {hasUnit ? ` ${measurement.measurementType.baseUnit}` : ""}
                                                    </TableCell>
                                                )
                                            })}
                                            <TableCell className="text-center">{option.colors.length}</TableCell>
                                            <TableCell className="text-center">{option.materials.length}</TableCell>
                                            <TableCell className="text-center">{option.fullCodes.length}</TableCell>
                                            <TableCell className="text-right pr-4">
                                                <div className="flex justify-end">
                                                    <ButtonShine
                                                        href={{
                                                            pathname: `/urun/${productSlug}/varyantlar`,
                                                            query: { m: option.key },
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        Varyantları Göster
                                                    </ButtonShine>
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
                                        {color.name}
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
