"use client"

import { useMemo } from "react"
import { useAttributesForFilter } from "../hooks/useAttributesForFilter"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

type Props = {
    value: string[]
    onChange: (value: string[]) => void
}

export function ProductAttributeSelect({ value, onChange }: Props) {

    const { data, isLoading } = useAttributesForFilter()
    const orderedAttributes = useMemo(() => {
        const attrs = data ?? []
        const priority = ["sector", "production_group", "usage_area"]
        const seen = new Set<string>()

        const prioritized = priority
            .map((code) => attrs.find((attr) => attr.code === code))
            .filter((attr): attr is (typeof attrs)[number] => Boolean(attr))
            .map((attr) => {
                seen.add(attr.id)
                return attr
            })

        const rest = attrs.filter((attr) => !seen.has(attr.id))
        return [...prioritized, ...rest]
    }, [data])

    const selectedIds = useMemo(() => new Set(value), [value])
    const valuesById = useMemo(() => {
        const map = new Map<string, { id: string; slug: string; parentValueId?: string | null; attributeCode: string }>()
        for (const attribute of data ?? []) {
            for (const val of attribute.values ?? []) {
                map.set(val.id, {
                    id: val.id,
                    slug: val.slug,
                    parentValueId: val.parentValueId ?? null,
                    attributeCode: attribute.code,
                })
            }
        }
        return map
    }, [data])

    const sectorAttribute = useMemo(
        () => (data ?? []).find((attr) => attr.code === "sector"),
        [data]
    )
    const productionGroupAttribute = useMemo(
        () => (data ?? []).find((attr) => attr.code === "production_group"),
        [data]
    )
    const usageAreaAttribute = useMemo(
        () => (data ?? []).find((attr) => attr.code === "usage_area"),
        [data]
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
        if (value.includes(valId)) {
            onChange(normalizeSelection(value.filter(v => v !== valId)))
        } else {
            onChange(normalizeSelection([...value, valId]))
        }
    }

    if (isLoading) {
        return <p className="text-sm text-neutral-500">Yükleniyor...</p>
    }

    if (!data?.length) {
        return <p className="text-sm text-neutral-500">Attribute bulunamadı</p>
    }

    return (
        <ScrollArea className="h-[300px] pr-2">
            <div className="space-y-6">

                {orderedAttributes.map(attribute => (

                    <div key={attribute.id} className="space-y-2">
                        {(() => {
                            const attributeValues = attribute.values ?? []
                            return (
                                <>

                                    {/* ATTRIBUTE TITLE */}
                                    <div className="text-sm font-semibold text-neutral-800">
                                        {attribute.name}
                                    </div>

                                    {/* VALUES */}
                                    <div className="grid grid-cols-2 gap-2">

                                        {(attribute.code === "production_group"
                                            ? visibleProductionGroups
                                            : attribute.code === "usage_area"
                                                ? visibleUsageAreas
                                                : attributeValues
                                        ).map(val => {

                                            const checked = value.includes(val.id)

                                            return (
                                                <Label
                                                    key={val.id}
                                                    className="flex items-center gap-2 border rounded-lg px-2 py-1.5 cursor-pointer hover:bg-neutral-50"
                                                >
                                                    <Checkbox
                                                        checked={checked}
                                                        onCheckedChange={() => toggle(val.id)}
                                                    />
                                                    <span className="text-sm">
                                                        {val.name}
                                                    </span>
                                                </Label>
                                            )
                                        })}

                                    </div>
                                </>
                            )
                        })()}
                    </div>

                ))}

            </div>
        </ScrollArea>
    )
}
