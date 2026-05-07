"use client"

import { useMemo } from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { useAttributesForFilter } from "../hooks/useAttributesForFilter"
import { cn } from "@/lib/utils"

type Props = {
    value: string[]
    onChange: (value: string[]) => void
    allowedAttributeValueIds?: string[]
    singleSelectNonHierarchy?: boolean
}

type AttributeValue = {
    id: string
    name: string
    parentValueId?: string | null
}

type Attribute = {
    id: string
    code: string
    name: string
    values?: AttributeValue[]
}

type AttributePickerProps = {
    attribute: Attribute
    values: AttributeValue[]
    selectedIds: Set<string>
    isMulti: boolean
    onToggle: (valueId: string) => void
    onSingleSelect: (attributeCode: string, nextValueId: string) => void
}

function AttributePicker({
    attribute,
    values,
    selectedIds,
    isMulti,
    onToggle,
    onSingleSelect,
}: AttributePickerProps) {
    const selectedValues = values.filter((item) => selectedIds.has(item.id))

    return (
        <div className="space-y-3 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold text-neutral-900">{attribute.name}</div>
                    <div className="text-xs text-neutral-500">
                        {isMulti ? "Birden fazla seçim yapılabilir" : "Tek değer seçilir"}
                    </div>
                </div>

                {selectedValues.length > 0 ? (
                    <Badge variant="outline" className="rounded-full border-neutral-200 bg-neutral-50 text-neutral-600">
                        {selectedValues.length} seçili
                    </Badge>
                ) : null}
            </div>

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="h-auto min-h-12 w-full justify-between rounded-xl border-dashed border-neutral-300 px-4 py-3 text-left text-sm text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <Search className="h-4 w-4 shrink-0 text-neutral-400" />
                            <span className="truncate">
                                {selectedValues.length > 0
                                    ? selectedValues.map((item) => item.name).join(", ")
                                    : `${attribute.name} seçin`}
                            </span>
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-neutral-200 p-0 shadow-xl" align="start">
                    <Command>
                        <div className="border-b border-neutral-100 px-3 py-3">
                            <CommandInput placeholder={`${attribute.name} ara`} className="h-10 rounded-xl border border-neutral-200 bg-white" />
                        </div>

                        <CommandList>
                            <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
                            <CommandGroup className="p-2">
                                <ScrollArea className="h-72 pr-2">
                                    <div className="space-y-1">
                                        {!isMulti ? (
                                            <CommandItem
                                                value="Seçilmedi"
                                                onSelect={() => onSingleSelect(attribute.code, "__none")}
                                                className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm"
                                            >
                                                <span>Seçilmedi</span>
                                                {selectedValues.length === 0 ? <Check className="h-4 w-4 text-brand" /> : null}
                                            </CommandItem>
                                        ) : null}

                                        {values.map((item) => {
                                            const checked = selectedIds.has(item.id)
                                            return (
                                                <CommandItem
                                                    key={item.id}
                                                    value={item.name}
                                                    onSelect={() => (isMulti ? onToggle(item.id) : onSingleSelect(attribute.code, item.id))}
                                                    className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="truncate font-medium text-neutral-800">{item.name}</div>
                                                    </div>
                                                    <Check className={cn("h-4 w-4 text-brand transition-opacity", checked ? "opacity-100" : "opacity-0")} />
                                                </CommandItem>
                                            )
                                        })}
                                    </div>
                                </ScrollArea>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {selectedValues.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {selectedValues.map((item) => (
                        <Badge
                            key={item.id}
                            variant="secondary"
                            className="group rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-neutral-700"
                        >
                            {item.name}
                            <button
                                type="button"
                                onClick={() => onToggle(item.id)}
                                className="ml-2 inline-flex rounded-full text-neutral-400 transition hover:text-neutral-700"
                                aria-label={`${item.name} seçimini kaldır`}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </Badge>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

export function ProductAttributeSelect({
    value,
    onChange,
    allowedAttributeValueIds,
    singleSelectNonHierarchy = true,
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
            .map((attribute) => ({
                ...attribute,
                values: (attribute.values ?? []).filter((item) => {
                    if (allowedSet.has(item.id)) return true
                    if (item.parentValueId && allowedSet.has(item.parentValueId)) return true
                    return false
                }),
            }))
            .filter((attribute) => (attribute.values?.length ?? 0) > 0)
    }, [data, allowedSet, hasRestriction])

    const orderedAttributes = useMemo(() => {
        const priority = ["sector", "production_group", "usage_area"]
        const seen = new Set<string>()

        const prioritized = priority
            .map((code) => scopedAttributes.find((attribute) => attribute.code === code))
            .filter((attribute): attribute is (typeof scopedAttributes)[number] => Boolean(attribute))
            .map((attribute) => {
                seen.add(attribute.id)
                return attribute
            })

        const rest = scopedAttributes.filter((attribute) => !seen.has(attribute.id))
        return [...prioritized, ...rest]
    }, [scopedAttributes])

    const selectedIds = useMemo(() => new Set(value), [value])
    const multiAttributeCodes = useMemo(() => new Set(["sector", "production_group", "usage_area"]), [])

    const valuesById = useMemo(() => {
        const map = new Map<string, { attributeCode: string }>()
        for (const attribute of scopedAttributes) {
            for (const item of attribute.values ?? []) {
                map.set(item.id, { attributeCode: attribute.code })
            }
        }
        return map
    }, [scopedAttributes])

    const sectorAttribute = useMemo(
        () => scopedAttributes.find((attribute) => attribute.code === "sector"),
        [scopedAttributes]
    )

    const productionGroupAttribute = useMemo(
        () => scopedAttributes.find((attribute) => attribute.code === "production_group"),
        [scopedAttributes]
    )

    const usageAreaAttribute = useMemo(
        () => scopedAttributes.find((attribute) => attribute.code === "usage_area"),
        [scopedAttributes]
    )

    const selectedSectorIds = useMemo(
        () =>
            (sectorAttribute?.values ?? [])
                .filter((item) => selectedIds.has(item.id))
                .map((item) => item.id),
        [sectorAttribute, selectedIds]
    )

    const selectedProductionGroupIds = useMemo(
        () =>
            (productionGroupAttribute?.values ?? [])
                .filter((item) => selectedIds.has(item.id))
                .map((item) => item.id),
        [productionGroupAttribute, selectedIds]
    )

    const visibleProductionGroups = useMemo(() => {
        const all = productionGroupAttribute?.values ?? []
        if (selectedSectorIds.length === 0) return all
        return all.filter((item) => item.parentValueId && selectedSectorIds.includes(item.parentValueId))
    }, [productionGroupAttribute, selectedSectorIds])

    const visibleUsageAreas = useMemo(() => {
        const all = usageAreaAttribute?.values ?? []
        if (selectedProductionGroupIds.length === 0) return all
        return all.filter((item) => item.parentValueId && selectedProductionGroupIds.includes(item.parentValueId))
    }, [usageAreaAttribute, selectedProductionGroupIds])

    function normalizeSelection(next: string[]) {
        const nextSet = new Set(next)

        if (singleSelectNonHierarchy) {
            for (const attribute of scopedAttributes) {
                if (multiAttributeCodes.has(attribute.code)) continue

                const selectedInAttribute = (attribute.values ?? [])
                    .filter((item) => nextSet.has(item.id))
                    .map((item) => item.id)

                for (const duplicateId of selectedInAttribute.slice(1)) {
                    nextSet.delete(duplicateId)
                }
            }
        }

        const nextSelectedSectorIds = (sectorAttribute?.values ?? [])
            .filter((item) => nextSet.has(item.id))
            .map((item) => item.id)

        const nextVisibleProductionGroups =
            nextSelectedSectorIds.length > 0
                ? (productionGroupAttribute?.values ?? []).filter(
                    (item) => item.parentValueId && nextSelectedSectorIds.includes(item.parentValueId)
                )
                : (productionGroupAttribute?.values ?? [])

        const allowedProductionGroupIds = new Set(nextVisibleProductionGroups.map((item) => item.id))

        for (const id of [...nextSet]) {
            const meta = valuesById.get(id)
            if (meta?.attributeCode === "production_group" && !allowedProductionGroupIds.has(id)) {
                nextSet.delete(id)
            }
        }

        const nextSelectedProductionGroupIds = (productionGroupAttribute?.values ?? [])
            .filter((item) => nextSet.has(item.id))
            .map((item) => item.id)

        const nextVisibleUsageAreas =
            nextSelectedProductionGroupIds.length > 0
                ? (usageAreaAttribute?.values ?? []).filter(
                    (item) => item.parentValueId && nextSelectedProductionGroupIds.includes(item.parentValueId)
                )
                : (usageAreaAttribute?.values ?? [])

        const allowedUsageAreaIds = new Set(nextVisibleUsageAreas.map((item) => item.id))

        for (const id of [...nextSet]) {
            const meta = valuesById.get(id)
            if (meta?.attributeCode === "usage_area" && !allowedUsageAreaIds.has(id)) {
                nextSet.delete(id)
            }
        }

        return [...nextSet]
    }

    function toggle(valueId: string) {
        if (value.includes(valueId)) {
            onChange(normalizeSelection(value.filter((item) => item !== valueId)))
            return
        }

        onChange(normalizeSelection([...value, valueId]))
    }

    function setSingle(attributeCode: string, nextValueId: string) {
        const nextSet = new Set(value)

        for (const [id, meta] of valuesById.entries()) {
            if (meta.attributeCode === attributeCode) nextSet.delete(id)
        }

        if (nextValueId !== "__none") nextSet.add(nextValueId)
        onChange(normalizeSelection([...nextSet]))
    }

    if (isLoading) return <p className="text-sm text-neutral-500">Attribute alanları yükleniyor...</p>
    if (!scopedAttributes.length) return <p className="text-sm text-neutral-500">Attribute bulunamadı.</p>

    return (
        <div className="space-y-4">
            {orderedAttributes.map((attribute) => {
                const values =
                    attribute.code === "production_group"
                        ? visibleProductionGroups
                        : attribute.code === "usage_area"
                            ? visibleUsageAreas
                            : (attribute.values ?? [])

                const isMulti = !singleSelectNonHierarchy || multiAttributeCodes.has(attribute.code)

                return (
                    <AttributePicker
                        key={attribute.id}
                        attribute={attribute}
                        values={values}
                        selectedIds={selectedIds}
                        isMulti={isMulti}
                        onToggle={toggle}
                        onSingleSelect={setSingle}
                    />
                )
            })}
        </div>
    )
}
