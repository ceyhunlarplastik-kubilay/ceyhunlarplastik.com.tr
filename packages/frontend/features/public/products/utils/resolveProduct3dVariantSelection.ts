import type { GroupedMeasurementOption } from "@/features/public/products/utils/groupedMeasurementOption"

export type Product3dVariantQuerySelection = {
    measurementKey?: string | null
    colorId?: string | null
    materialId?: string | null
}

function materialKey(materialIds: string[]) {
    return [...materialIds].sort().join(",")
}

export function resolveProduct3dVariantSelection(
    options: GroupedMeasurementOption[],
    requested: Product3dVariantQuerySelection,
) {
    const measurement = options.find((option) => option.key === requested.measurementKey) ?? options[0]
    if (!measurement) return null

    const availableColorIds = new Set(measurement.variants.flatMap((variant) =>
        variant.colorId ? [variant.colorId] : [],
    ))
    const colors = measurement.colors.filter((color) => availableColorIds.has(color.id))
    const selectedColorId = colors.some((color) => color.id === requested.colorId)
        ? requested.colorId ?? null
        : colors[0]?.id ?? null
    const colorCandidates = selectedColorId
        ? measurement.variants.filter((variant) => variant.colorId === selectedColorId)
        : measurement.variants

    const materialOptions = colorCandidates
        .map((variant) => ({
            key: materialKey(variant.materialIds),
            materials: measurement.materials.filter((material) => variant.materialIds.includes(material.id)),
        }))
        .filter((option) => option.key.length > 0)
        .filter((option, index, items) => items.findIndex((item) => item.key === option.key) === index)
    const selectedMaterialKey = materialOptions.some((option) => option.key === requested.materialId)
        ? requested.materialId ?? null
        : materialOptions[0]?.key ?? null
    const selectedMaterialOption = materialOptions.find((option) => option.key === selectedMaterialKey) ?? null
    const variant = colorCandidates.find((candidate) =>
        selectedMaterialKey === null || materialKey(candidate.materialIds) === selectedMaterialKey,
    ) ?? colorCandidates[0] ?? measurement.variants[0] ?? null

    return {
        measurement,
        colors,
        materialOptions,
        selectedColorId,
        selectedMaterialId: selectedMaterialKey,
        selectedColor: colors.find((color) => color.id === selectedColorId) ?? null,
        selectedMaterials: selectedMaterialOption?.materials ?? [],
        selectedMaterial: selectedMaterialOption?.materials[0] ?? null,
        variant,
    }
}
