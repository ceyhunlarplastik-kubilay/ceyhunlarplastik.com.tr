"use client"

import { useMemo } from "react"
import { useAttributesForFilter } from "../hooks/useAttributesForFilter"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type Props = {
    value: string[]
    onChange: (value: string[]) => void
    allowedAttributeValueIds?: string[]
    singleSelectNonHierarchy?: boolean
}

export function ProductAttributeSelect({
    value,
    onChange,
    allowedAttributeValueIds,
    singleSelectNonHierarchy = false,
}: Props) {
    const { data, isLoading } = useAttributesForFilter()
    const hasRestriction = allowedAttributeValueIds !== undefined

    const allowedSet = useMemo(
        () => (hasRestriction ? new Set(allowedAttributeValueIds ?? []) : null),
        [allowedAttributeValueIds, hasRestriction]
    )

    const scopedAttributes = useMemo(() => {
        const attrs = data ?? []
        if (!hasRestriction || !allowedSet) return attrs

        return attrs
            .map((attribute) => {
                return {
                    ...attribute,
                    values: (attribute.values ?? []).filter((v) => {
                        if (allowedSet.has(v.id)) return true
                        if (v.parentValueId && allowedSet.has(v.parentValueId)) return true
                        return false
                    }),
                }
            })
            .filter((attribute) => (attribute.values?.length ?? 0) > 0)
    }, [data, allowedSet, hasRestriction])

    const orderedAttributes = useMemo(() => {
        const priority = ["sector", "production_group", "usage_area"]
        const seen = new Set<string>()

        const prioritized = priority
            .map((code) => scopedAttributes.find((attr) => attr.code === code))
            .filter((attr): attr is (typeof scopedAttributes)[number] => Boolean(attr))
            .map((attr) => {
                seen.add(attr.id)
                return attr
            })

        const rest = scopedAttributes.filter((attr) => !seen.has(attr.id))
        return [...prioritized, ...rest]
    }, [scopedAttributes])

    const selectedIds = useMemo(() => new Set(value), [value])
    const multiAttributeCodes = useMemo(
        () => new Set(["sector", "production_group", "usage_area"]),
        []
    )

    const valuesById = useMemo(() => {
        const map = new Map<string, { attributeCode: string }>()
        for (const attribute of scopedAttributes) {
            for (const val of attribute.values ?? []) {
                map.set(val.id, { attributeCode: attribute.code })
            }
        }
        return map
    }, [scopedAttributes])

    const sectorAttribute = useMemo(
        () => scopedAttributes.find((attr) => attr.code === "sector"),
        [scopedAttributes]
    )

    const productionGroupAttribute = useMemo(
        () => scopedAttributes.find((attr) => attr.code === "production_group"),
        [scopedAttributes]
    )

    const usageAreaAttribute = useMemo(
        () => scopedAttributes.find((attr) => attr.code === "usage_area"),
        [scopedAttributes]
    )

    const selectedSectorIds = useMemo(
        () =>
            (sectorAttribute?.values ?? [])
                .filter((v) => selectedIds.has(v.id))
                .map((v) => v.id),
        [sectorAttribute, selectedIds]
    )

    const selectedProductionGroupIds = useMemo(
        () =>
            (productionGroupAttribute?.values ?? [])
                .filter((v) => selectedIds.has(v.id))
                .map((v) => v.id),
        [productionGroupAttribute, selectedIds]
    )

    const visibleProductionGroups = useMemo(() => {
        const all = productionGroupAttribute?.values ?? []
        if (selectedSectorIds.length === 0) return all
        return all.filter((v) => v.parentValueId && selectedSectorIds.includes(v.parentValueId))
    }, [productionGroupAttribute, selectedSectorIds])

    const visibleUsageAreas = useMemo(() => {
        const all = usageAreaAttribute?.values ?? []
        if (selectedProductionGroupIds.length === 0) return all
        return all.filter((v) => v.parentValueId && selectedProductionGroupIds.includes(v.parentValueId))
    }, [usageAreaAttribute, selectedProductionGroupIds])

    function normalizeSelection(next: string[]) {
        const nextSet = new Set(next)

        if (singleSelectNonHierarchy) {
            // Product forms: non-hierarchical attributes are single-select.
            for (const attribute of scopedAttributes) {
                if (multiAttributeCodes.has(attribute.code)) continue

                const selectedInAttribute = (attribute.values ?? [])
                    .filter((v) => nextSet.has(v.id))
                    .map((v) => v.id)

                for (const duplicateId of selectedInAttribute.slice(1)) {
                    nextSet.delete(duplicateId)
                }
            }
        }

        const nextSelectedSectorIds = (sectorAttribute?.values ?? [])
            .filter((v) => nextSet.has(v.id))
            .map((v) => v.id)

        const nextVisibleProductionGroups =
            nextSelectedSectorIds.length > 0
                ? (productionGroupAttribute?.values ?? []).filter(
                    (v) => v.parentValueId && nextSelectedSectorIds.includes(v.parentValueId)
                )
                : (productionGroupAttribute?.values ?? [])

        const allowedProductionGroupIds = new Set(nextVisibleProductionGroups.map((v) => v.id))

        for (const id of [...nextSet]) {
            const meta = valuesById.get(id)
            if (meta?.attributeCode === "production_group" && !allowedProductionGroupIds.has(id)) {
                nextSet.delete(id)
            }
        }

        const nextSelectedProductionGroupIds = (productionGroupAttribute?.values ?? [])
            .filter((v) => nextSet.has(v.id))
            .map((v) => v.id)

        const nextVisibleUsageAreas =
            nextSelectedProductionGroupIds.length > 0
                ? (usageAreaAttribute?.values ?? []).filter(
                    (v) => v.parentValueId && nextSelectedProductionGroupIds.includes(v.parentValueId)
                )
                : (usageAreaAttribute?.values ?? [])

        const allowedUsageAreaIds = new Set(nextVisibleUsageAreas.map((v) => v.id))

        for (const id of [...nextSet]) {
            const meta = valuesById.get(id)
            if (meta?.attributeCode === "usage_area" && !allowedUsageAreaIds.has(id)) {
                nextSet.delete(id)
            }
        }

        return [...nextSet]
    }

    function toggle(valId: string) {
        if (value.includes(valId)) onChange(normalizeSelection(value.filter((v) => v !== valId)))
        else onChange(normalizeSelection([...value, valId]))
    }

    function setSingle(attributeCode: string, nextValueId: string) {
        const nextSet = new Set(value)

        for (const [id, meta] of valuesById.entries()) {
            if (meta.attributeCode === attributeCode) nextSet.delete(id)
        }

        if (nextValueId !== "__none") nextSet.add(nextValueId)
        onChange(normalizeSelection([...nextSet]))
    }

    if (isLoading) return <p className="text-sm text-neutral-500">Yükleniyor...</p>
    if (!scopedAttributes.length) return <p className="text-sm text-neutral-500">Attribute bulunamadı</p>

    return (
        <ScrollArea className="h-[300px] pr-2">
            <div className="space-y-6">
                {orderedAttributes.map((attribute) => {
                    const attributeValues = attribute.values ?? []
                    const values =
                        attribute.code === "production_group"
                            ? visibleProductionGroups
                            : attribute.code === "usage_area"
                                ? visibleUsageAreas
                                : attributeValues
                    const isMulti = !singleSelectNonHierarchy || multiAttributeCodes.has(attribute.code)
                    const selectedForAttribute = values.find((val) => selectedIds.has(val.id))?.id

                    return (
                        <div key={attribute.id} className="space-y-2">
                            <div className="text-sm font-semibold text-neutral-800">{attribute.name}</div>
                            {isMulti ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {values.map((val) => {
                                        const checked = value.includes(val.id)
                                        return (
                                            <Label
                                                key={val.id}
                                                className="flex items-center gap-2 border rounded-lg px-2 py-1.5 cursor-pointer hover:bg-neutral-50"
                                            >
                                                <Checkbox checked={checked} onCheckedChange={() => toggle(val.id)} />
                                                <span className="text-sm">{val.name}</span>
                                            </Label>
                                        )
                                    })}
                                </div>
                            ) : (
                                <Select
                                    value={selectedForAttribute ?? "__none"}
                                    onValueChange={(nextValue) => setSingle(attribute.code, nextValue)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={`${attribute.name} seç`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none">Seçilmedi</SelectItem>
                                        {values.map((val) => (
                                            <SelectItem key={val.id} value={val.id}>
                                                {val.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    )
                })}
            </div>
        </ScrollArea>
    )
}
