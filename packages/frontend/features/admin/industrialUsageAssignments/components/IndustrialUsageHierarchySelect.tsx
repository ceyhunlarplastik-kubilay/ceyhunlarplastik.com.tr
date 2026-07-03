"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Layers3, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type {
    AttributeValue,
    ProductAttribute,
} from "@/features/admin/productAttributes/api/listAttributesWithValues"

type HierarchySelection = {
    sectorValueId?: string | null
    productionGroupValueId?: string | null
    usageAreaValueId?: string | null
}

type Props = {
    attributes?: ProductAttribute[]
    isLoading?: boolean
    sectorValueId: string
    productionGroupValueId: string
    usageAreaValueId: string
    onSelectionChange: (selection: HierarchySelection) => void
}

type ComboboxOption = {
    id: string
    label: string
    subtitle?: string
}

function getAttributeValues(attributes: ProductAttribute[] | undefined, code: string) {
    return attributes?.find((attribute) => attribute.code === code)?.values ?? []
}

function sortValues(values: AttributeValue[]) {
    return [...values].sort((left, right) => {
        const displayOrderCompare = (left.displayOrder ?? 0) - (right.displayOrder ?? 0)
        if (displayOrderCompare !== 0) return displayOrderCompare

        return left.name.localeCompare(right.name, "tr", {
            numeric: true,
            sensitivity: "base",
        })
    })
}

function SearchableAttributeCombobox({
    label,
    placeholder,
    searchPlaceholder,
    emptyText,
    value,
    options,
    required = false,
    onChange,
}: {
    label: string
    placeholder: string
    searchPlaceholder: string
    emptyText: string
    value: string
    options: ComboboxOption[]
    required?: boolean
    onChange: (value: string) => void
}) {
    const [open, setOpen] = useState(false)
    const selected = options.find((option) => option.id === value)

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    {label}
                </label>
                {required ? (
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                        Zorunlu
                    </span>
                ) : (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
                        Opsiyonel
                    </span>
                )}
            </div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className={cn(
                            "h-12 w-full justify-between rounded-2xl border-neutral-200 bg-neutral-50 px-3 text-left font-normal",
                            !selected && "text-neutral-500",
                        )}
                    >
                        <span className="min-w-0 truncate">
                            {selected ? selected.label : placeholder}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-neutral-400" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(var(--radix-popover-trigger-width),calc(100vw-2rem))] p-0" align="start">
                    <Command>
                        <CommandInput placeholder={searchPlaceholder} />
                        <CommandList className="max-h-[320px]">
                            <CommandEmpty>{emptyText}</CommandEmpty>
                            <CommandGroup>
                                {!required && value ? (
                                    <CommandItem
                                        value="__clear__"
                                        onSelect={() => {
                                            onChange("")
                                            setOpen(false)
                                        }}
                                        className="text-neutral-500"
                                    >
                                        <X className="h-4 w-4" />
                                        Seçimi temizle
                                    </CommandItem>
                                ) : null}
                                {options.map((option) => (
                                    <CommandItem
                                        key={option.id}
                                        value={`${option.id} ${option.label} ${option.subtitle ?? ""}`}
                                        onSelect={() => {
                                            onChange(option.id)
                                            setOpen(false)
                                        }}
                                        className="items-start gap-3"
                                    >
                                        <Check
                                            className={cn(
                                                "mt-0.5 h-4 w-4 shrink-0",
                                                option.id === value ? "opacity-100" : "opacity-0",
                                            )}
                                        />
                                        <span className="min-w-0">
                                            <span className="block truncate font-medium">
                                                {option.label}
                                            </span>
                                            {option.subtitle ? (
                                                <span className="mt-0.5 block truncate text-xs text-neutral-500">
                                                    {option.subtitle}
                                                </span>
                                            ) : null}
                                        </span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {selected?.subtitle ? (
                <p className="truncate text-xs text-neutral-500">{selected.subtitle}</p>
            ) : null}
        </div>
    )
}

export function IndustrialUsageHierarchySelect({
    attributes,
    isLoading = false,
    sectorValueId,
    productionGroupValueId,
    usageAreaValueId,
    onSelectionChange,
}: Props) {
    const sectors = sortValues(getAttributeValues(attributes, "sector"))
    const allProductionGroups = sortValues(getAttributeValues(attributes, "production_group"))
    const allUsageAreas = sortValues(getAttributeValues(attributes, "usage_area"))

    const sectorById = new Map(sectors.map((sector) => [sector.id, sector]))
    const productionGroupById = new Map(allProductionGroups.map((group) => [group.id, group]))

    const getSectorIdForProductionGroup = (productionGroup?: AttributeValue) =>
        productionGroup?.parentValueId ?? ""

    const getParentsForUsageArea = (usageArea?: AttributeValue) => {
        const productionGroup = usageArea?.parentValueId
            ? productionGroupById.get(usageArea.parentValueId)
            : undefined
        const sectorId = getSectorIdForProductionGroup(productionGroup)

        return {
            productionGroupId: productionGroup?.id ?? "",
            sectorId,
        }
    }

    const productionGroups = sectorValueId
        ? allProductionGroups.filter((group) => group.parentValueId === sectorValueId)
        : allProductionGroups

    const usageAreas = allUsageAreas.filter((usageArea) => {
        const parents = getParentsForUsageArea(usageArea)
        if (productionGroupValueId) return parents.productionGroupId === productionGroupValueId
        if (sectorValueId) return parents.sectorId === sectorValueId
        return true
    })

    const sectorOptions: ComboboxOption[] = sectors.map((sector) => ({
        id: sector.id,
        label: sector.name,
    }))
    const productionGroupOptions: ComboboxOption[] = productionGroups.map((group) => ({
        id: group.id,
        label: group.name,
        subtitle: group.parentValueId
            ? sectorById.get(group.parentValueId)?.name
            : undefined,
    }))
    const usageAreaOptions: ComboboxOption[] = usageAreas.map((usageArea) => {
        const parents = getParentsForUsageArea(usageArea)
        const productionGroup = parents.productionGroupId
            ? productionGroupById.get(parents.productionGroupId)
            : undefined
        const sector = parents.sectorId ? sectorById.get(parents.sectorId) : undefined

        return {
            id: usageArea.id,
            label: usageArea.name,
            subtitle: [sector?.name, productionGroup?.name].filter(Boolean).join(" / "),
        }
    })

    const handleSectorChange = (nextSectorValueId: string) => {
        const currentGroupBelongsToSector = productionGroupValueId
            ? productionGroupById.get(productionGroupValueId)?.parentValueId === nextSectorValueId
            : false
        const currentUsageParents = usageAreaValueId
            ? getParentsForUsageArea(allUsageAreas.find((usageArea) => usageArea.id === usageAreaValueId))
            : null
        const currentUsageBelongsToSector =
            Boolean(currentUsageParents?.sectorId) &&
            currentUsageParents?.sectorId === nextSectorValueId

        onSelectionChange({
            sectorValueId: nextSectorValueId,
            productionGroupValueId: currentGroupBelongsToSector
                ? productionGroupValueId
                : null,
            usageAreaValueId: currentUsageBelongsToSector
                ? usageAreaValueId
                : null,
        })
    }

    const handleProductionGroupChange = (nextProductionGroupValueId: string) => {
        if (!nextProductionGroupValueId) {
            onSelectionChange({
                sectorValueId,
                productionGroupValueId: null,
                usageAreaValueId: null,
            })
            return
        }

        const productionGroup = productionGroupById.get(nextProductionGroupValueId)
        const nextSectorValueId = getSectorIdForProductionGroup(productionGroup)
        const currentUsageParents = usageAreaValueId
            ? getParentsForUsageArea(allUsageAreas.find((usageArea) => usageArea.id === usageAreaValueId))
            : null

        onSelectionChange({
            sectorValueId: nextSectorValueId || sectorValueId || null,
            productionGroupValueId: nextProductionGroupValueId,
            usageAreaValueId: currentUsageParents?.productionGroupId === nextProductionGroupValueId
                ? usageAreaValueId
                : null,
        })
    }

    const handleUsageAreaChange = (nextUsageAreaValueId: string) => {
        if (!nextUsageAreaValueId) {
            onSelectionChange({
                sectorValueId,
                productionGroupValueId,
                usageAreaValueId: null,
            })
            return
        }

        const usageArea = allUsageAreas.find((value) => value.id === nextUsageAreaValueId)
        const parents = getParentsForUsageArea(usageArea)

        onSelectionChange({
            sectorValueId: parents.sectorId || sectorValueId || null,
            productionGroupValueId: parents.productionGroupId || null,
            usageAreaValueId: nextUsageAreaValueId,
        })
    }

    if (isLoading) {
        return (
            <div className="grid gap-3 lg:grid-cols-3">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
            </div>
        )
    }

    return (
        <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand/10 text-brand">
                        <Layers3 className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-neutral-950">
                            Kullanım alanı seçimi
                        </h2>
                        <p className="text-sm text-neutral-500">
                            Sektör ve kullanım alanı zorunludur. Üretim grubu seçime göre otomatik tamamlanır.
                        </p>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        onSelectionChange({
                            sectorValueId: null,
                            productionGroupValueId: null,
                            usageAreaValueId: null,
                        })
                    }
                    disabled={!sectorValueId && !productionGroupValueId && !usageAreaValueId}
                    className="h-9 w-full rounded-2xl sm:w-auto"
                >
                    <X className="h-4 w-4" />
                    Seçimi Temizle
                </Button>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
                <SearchableAttributeCombobox
                    label="Sektör"
                    placeholder="Sektör seçin"
                    searchPlaceholder="Sektör ara..."
                    emptyText="Sektör bulunamadı."
                    value={sectorValueId}
                    options={sectorOptions}
                    required
                    onChange={handleSectorChange}
                />

                <SearchableAttributeCombobox
                    label="Üretim Grubu"
                    placeholder="Üretim grubu seçin"
                    searchPlaceholder="Üretim grubu ara..."
                    emptyText="Üretim grubu bulunamadı."
                    value={productionGroupValueId}
                    options={productionGroupOptions}
                    onChange={handleProductionGroupChange}
                />

                <SearchableAttributeCombobox
                    label="Kullanım Alanı"
                    placeholder="Kullanım alanı seçin"
                    searchPlaceholder="Kullanım alanı ara..."
                    emptyText="Kullanım alanı bulunamadı."
                    value={usageAreaValueId}
                    options={usageAreaOptions}
                    required
                    onChange={handleUsageAreaChange}
                />
            </div>
        </div>
    )
}
