"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Layers3 } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { AttributeHeader } from "@/features/admin/productAttributes/components/AttributeHeader"
import { ProductAttributeListFilters } from "@/features/admin/productAttributes/components/ProductAttributeListFilters"
import { useAttributesForFilter } from "@/features/admin/productAttributes/hooks/useAttributesForFilter"
import { useProductAttributeListFilters } from "@/features/admin/productAttributes/hooks/useProductAttributeListFilters"
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar"

const hierarchyCodes = new Set(["sector", "production_group", "usage_area"])

export function ProductAttributesPageClient() {
    const {
        filters,
        setSearch,
        setCode,
        setRefreshIntervalSeconds,
    } = useProductAttributeListFilters()

    const attributesQuery = useAttributesForFilter({
        autoRefreshIntervalMs: filters.refreshIntervalSeconds > 0
            ? filters.refreshIntervalSeconds * 1000
            : false,
    })

    const attributes = useMemo(() => attributesQuery.data ?? [], [attributesQuery.data])

    const filteredAttributes = useMemo(() => {
        const normalizedSearch = filters.search.trim().toLocaleLowerCase("tr-TR")

        return attributes.filter((attribute) => {
            const matchesCode = !filters.code || attribute.code === filters.code

            if (!matchesCode) return false
            if (!normalizedSearch) return true

            return `${attribute.name} ${attribute.code}`
                .toLocaleLowerCase("tr-TR")
                .includes(normalizedSearch)
        })
    }, [attributes, filters.code, filters.search])

    return (
        <div className="space-y-6 p-6">
            <AttributeHeader />

            <ProductAttributeListFilters
                attributes={attributes}
                search={filters.search}
                code={filters.code}
                onSearchChange={setSearch}
                onCodeChange={setCode}
            />

            <AdminListRefreshBar
                dataUpdatedAt={attributesQuery.dataUpdatedAt}
                isFetching={attributesQuery.isFetching}
                onRefresh={() => void attributesQuery.refetch()}
                refreshIntervalSeconds={filters.refreshIntervalSeconds}
                onRefreshIntervalChange={setRefreshIntervalSeconds}
            />

            <div className="rounded-2xl border bg-white p-4 text-sm text-neutral-600 shadow-sm">
                Toplam <span className="font-semibold text-neutral-900">{filteredAttributes.length}</span> özellik
            </div>

            {attributesQuery.isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Spinner />
                </div>
            ) : filteredAttributes.length === 0 ? (
                <p className="text-sm text-neutral-500">
                    Seçilen filtrelere göre özellik bulunamadı.
                </p>
            ) : (
                <div className="grid gap-4">
                    {filteredAttributes.map((attribute) => (
                        <Link
                            key={attribute.id}
                            href={`/admin/productAttributes/${attribute.id}`}
                            className="rounded-2xl border bg-white p-4 shadow-sm transition hover:bg-neutral-50"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-neutral-900">{attribute.name}</p>
                                        {hierarchyCodes.has(attribute.code) && (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                                <Layers3 className="h-3 w-3" />
                                                Hiyerarşik
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-neutral-500">{attribute.code}</p>
                                </div>

                                <span className="text-xs text-neutral-400">
                                    {attribute.values?.length ?? 0} değer
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
