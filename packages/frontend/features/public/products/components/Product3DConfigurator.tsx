"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import { parseAsString, useQueryStates } from "nuqs"
import { Box, Layers3, Palette, Ruler } from "lucide-react"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import Product3DModelViewer from "@/features/public/products/components/Product3DModelViewer"
import type { GroupedMeasurementOption } from "@/features/public/products/utils/groupedMeasurementOption"
import { resolveProduct3dVariantSelection } from "@/features/public/products/utils/resolveProduct3dVariantSelection"
import type { ProductModel3dConfig } from "@core/helpers/products/model3dConfig"

const ProductR3FModelViewer = dynamic(
    () => import("@/features/public/products/components/ProductR3FModelViewer"),
    { ssr: false },
)

type ViewerLabels = {
    alt: string
    loadingLabel: string
    errorTitle: string
    errorDescription: string
    interactionHint: string
    resetViewLabel: string
    fullscreenLabel: string
}

type Props = {
    src: string
    config?: ProductModel3dConfig
    options: GroupedMeasurementOption[]
    viewerLabels: ViewerLabels
    selectorLabels: {
        measurement: string
        color: string
        material: string
    }
}

const selectionParsers = {
    m: parseAsString,
    c: parseAsString,
    mat: parseAsString,
}

function isConfigCompatibleWithOptions(
    config: ProductModel3dConfig | undefined,
    options: GroupedMeasurementOption[],
) {
    if (!config || options.length === 0) return false

    return options.every((option) => {
        const measurementValues = new Map(
            option.measurements.map((measurement) => [measurement.measurementType.code, measurement.value]),
        )

        return config.parameters.every((parameter) => {
            const value = measurementValues.get(parameter.measurementCode)
            return value !== undefined
                && (parameter.min === undefined || value >= parameter.min)
                && (parameter.max === undefined || value <= parameter.max)
        })
    })
}

export default function Product3DConfigurator({
    src,
    config,
    options,
    viewerLabels,
    selectorLabels,
}: Props) {
    const [querySelection, setQuerySelection] = useQueryStates(
        selectionParsers,
        { history: "replace", shallow: true },
    )
    const selection = useMemo(
        () => resolveProduct3dVariantSelection(options, {
            measurementKey: querySelection.m,
            colorId: querySelection.c,
            materialId: querySelection.mat,
        }),
        [options, querySelection.c, querySelection.m, querySelection.mat],
    )
    const useParametricViewer = isConfigCompatibleWithOptions(config, options)
    const measurements = useMemo(() => Object.fromEntries(
        (selection?.measurement.measurements ?? []).map((measurement) => [
            measurement.measurementType.code,
            measurement.value,
        ]),
    ), [selection?.measurement.measurements])

    const commitSelection = (next: { m?: string | null; c?: string | null; mat?: string | null }) => {
        const resolved = resolveProduct3dVariantSelection(options, {
            measurementKey: next.m ?? selection?.measurement.key,
            colorId: next.c === undefined ? selection?.selectedColorId : next.c,
            materialId: next.mat === undefined ? selection?.selectedMaterialId : next.mat,
        })
        if (!resolved) return

        void setQuerySelection({
            m: resolved.measurement.key,
            c: resolved.selectedColorId,
            mat: resolved.selectedMaterialId,
        })
    }

    return (
        <div className="grid min-h-[430px] grid-rows-[1fr_auto]">
            {useParametricViewer && config ? (
                <ProductR3FModelViewer
                    key={src}
                    src={src}
                    config={config}
                    measurements={measurements}
                    colorHex={selection?.selectedColor?.hex}
                    materialCodes={selection?.selectedMaterials.map((material) => material.code).filter((code): code is string => Boolean(code))}
                    {...viewerLabels}
                />
            ) : (
                <Product3DModelViewer src={src} {...viewerLabels} />
            )}

            {useParametricViewer && selection ? (
                <div className="grid gap-3 border-t border-neutral-200 bg-white p-4 sm:grid-cols-3">
                    <label className="space-y-1.5">
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                            <Ruler className="size-3.5" aria-hidden="true" />
                            {selectorLabels.measurement}
                        </span>
                        <Select
                            value={selection.measurement.key}
                            onValueChange={(value) => commitSelection({ m: value, c: null, mat: null })}
                        >
                            <SelectTrigger className="w-full bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {options.map((option) => (
                                    <SelectItem key={option.key} value={option.key}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>

                    <label className="space-y-1.5">
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                            <Palette className="size-3.5" aria-hidden="true" />
                            {selectorLabels.color}
                        </span>
                        <Select
                            value={selection.selectedColorId ?? "none"}
                            onValueChange={(value) => commitSelection({ c: value === "none" ? null : value, mat: null })}
                            disabled={selection.colors.length === 0}
                        >
                            <SelectTrigger className="w-full bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {selection.colors.length === 0 ? <SelectItem value="none">—</SelectItem> : null}
                                {selection.colors.map((color) => (
                                    <SelectItem key={color.id} value={color.id}>
                                        <span className="inline-flex items-center gap-2">
                                            <span
                                                className="size-3 rounded-full border border-neutral-300"
                                                style={{ backgroundColor: color.hex || "#d4d4d4" }}
                                            />
                                            {color.name}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>

                    <label className="space-y-1.5">
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                            <Layers3 className="size-3.5" aria-hidden="true" />
                            {selectorLabels.material}
                        </span>
                        <Select
                            value={selection.selectedMaterialId ?? "none"}
                            onValueChange={(value) => commitSelection({ mat: value === "none" ? null : value })}
                            disabled={selection.materialOptions.length === 0}
                        >
                            <SelectTrigger className="w-full bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {selection.materialOptions.length === 0 ? <SelectItem value="none">—</SelectItem> : null}
                                {selection.materialOptions.map((option) => (
                                    <SelectItem key={option.key || "none"} value={option.key || "none"}>
                                        {option.materials.map((material) =>
                                            material.code ? `${material.name} (${material.code})` : material.name,
                                        ).join(" + ") || "—"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>

                    <div className="sm:col-span-3 flex items-center gap-2 text-[11px] text-neutral-500">
                        <Box className="size-3.5" aria-hidden="true" />
                        <span className="font-mono">{selection.variant?.fullCode}</span>
                    </div>
                </div>
            ) : null}
        </div>
    )
}
