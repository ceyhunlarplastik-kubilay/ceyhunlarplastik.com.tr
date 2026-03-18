"use client"

import { useMemo, useState } from "react"
import { Palette, Ruler, Layers3 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
}

interface ProductVariantTableProps {
    variants: VariantTableData[]
}

function normalizeNumeric(value: number): string {
    if (!Number.isFinite(value)) return String(value)
    return Number.parseFloat(value.toFixed(6)).toString()
}

function formatMeasurementValue(measurement: VariantMeasurement): string {
    const code = measurement.measurementType.code
    const label = measurement.label?.trim()

    if ((code === "D" || code === "M") && label) {
        return label.toUpperCase().startsWith("M") ? label.toUpperCase() : `M${label}`
    }

    if (label) return label
    return normalizeNumeric(measurement.value)
}

function buildMeasurementKey(measurements: VariantMeasurement[]): string {
    return [...measurements]
        .sort((a, b) => a.measurementType.displayOrder - b.measurementType.displayOrder)
        .map(
            (measurement) =>
                `${measurement.measurementType.id}:${normalizeNumeric(measurement.value)}`
        )
        .join("|")
}

function toMeasurementLabel(measurements: VariantMeasurement[]): string {
    return [...measurements]
        .sort((a, b) => a.measurementType.displayOrder - b.measurementType.displayOrder)
        .map(
            (measurement) =>
                `${measurement.measurementType.name} (${measurement.measurementType.code}): ${formatMeasurementValue(measurement)}`
        )
        .join(" · ")
}

export default function ProductVariantTable({ variants }: ProductVariantTableProps) {
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
        }

        return Array.from(groups.values()).sort((a, b) => {
            const aFirst = a.measurements[0]?.value ?? 0
            const bFirst = b.measurements[0]?.value ?? 0
            return aFirst - bFirst
        })
    }, [variants])

    const [selectedKey, setSelectedKey] = useState<string>("")

    const selected = options.find((option) => option.key === selectedKey) ?? options[0]

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
                    <div className="max-h-[380px] overflow-y-auto pr-1 space-y-2">
                        {options.map((option) => {
                            const isActive = selected?.key === option.key

                            return (
                                <Button
                                    key={option.key}
                                    type="button"
                                    variant={isActive ? "default" : "outline"}
                                    className="w-full justify-start h-auto py-2.5 px-3 text-left"
                                    onClick={() => setSelectedKey(option.key)}
                                >
                                    <span className="text-sm leading-relaxed whitespace-normal break-words">
                                        {option.label}
                                    </span>
                                </Button>
                            )
                        })}
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
