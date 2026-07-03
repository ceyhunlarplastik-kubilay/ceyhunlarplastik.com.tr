"use client"

import Link from "next/link"
import { useMemo } from "react"
import { motion } from "motion/react"
import { ArrowRight, Database, Image as ImageIcon, Layers3, UserRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { AttributeHeader } from "@/features/admin/productAttributes/components/AttributeHeader"
import { ProductAttributeListFilters } from "@/features/admin/productAttributes/components/ProductAttributeListFilters"
import { useAttributesForFilter } from "@/features/admin/productAttributes/hooks/useAttributesForFilter"
import { useProductAttributeListFilters } from "@/features/admin/productAttributes/hooks/useProductAttributeListFilters"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar"

const hierarchyCodes = new Set(["sector", "production_group", "usage_area"])

type Props = {
    basePath?: string
    title?: string
    description?: string
}

export function ProductAttributesPageClient({
    basePath = "/admin/productAttributes",
    title = "Ürün Özellikleri",
    description = "Ürün özelliklerini, müşteri profil alanlarını ve ürün filtre sözlüğünü yönetin.",
}: Props) {
    const {
        filters,
        setSearch,
        setCode,
        setPage,
        setLimit,
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

    const totalPages = Math.max(1, Math.ceil(filteredAttributes.length / filters.limit))
    const currentPage = Math.min(filters.page, totalPages)
    const paginatedAttributes = filteredAttributes.slice(
        (currentPage - 1) * filters.limit,
        currentPage * filters.limit,
    )
    const totalValues = filteredAttributes.reduce((sum, attribute) => sum + (attribute.values?.length ?? 0), 0)
    const visualValueCount = filteredAttributes.reduce(
        (sum, attribute) => sum + (attribute.values ?? []).filter((value) => (value.assets?.length ?? 0) > 0).length,
        0,
    )

    return (
        <div className="space-y-6">
            <AttributeHeader
                title={title}
                description={description}
            />

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

            <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
                        <Database className="h-4 w-4" />
                        Özellik
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-neutral-950">{filteredAttributes.length}</div>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
                        <Layers3 className="h-4 w-4" />
                        Değer
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-neutral-950">{totalValues}</div>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
                        <ImageIcon className="h-4 w-4" />
                        Görselli Değer
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-neutral-950">{visualValueCount}</div>
                </div>
            </div>

            {attributesQuery.isLoading ? (
                <div className="flex items-center justify-center rounded-[28px] border border-neutral-200 bg-white py-16 shadow-sm">
                    <Spinner />
                </div>
            ) : filteredAttributes.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-neutral-200 bg-white px-6 py-14 text-center shadow-sm">
                    <Database className="mx-auto h-8 w-8 text-neutral-400" />
                    <h2 className="mt-3 text-base font-semibold text-neutral-950">Özellik bulunamadı</h2>
                    <p className="mt-1 text-sm text-neutral-500">Seçilen filtreleri temizleyerek tekrar deneyebilirsiniz.</p>
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {paginatedAttributes.map((attribute, index) => {
                        const isSystemCustomerAttribute = hierarchyCodes.has(attribute.code)
                        const valueCount = attribute.values?.length ?? 0
                        const imageCount = (attribute.values ?? []).filter((value) => (value.assets?.length ?? 0) > 0).length

                        return (
                            <motion.div
                                key={attribute.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.22, delay: index * 0.025 }}
                            >
                                <Link
                                    href={`${basePath}/${attribute.id}`}
                                    className="group block h-full rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md"
                                >
                                    <div className="flex h-full flex-col gap-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="truncate text-base font-semibold text-neutral-950">{attribute.name}</p>
                                                <p className="mt-1 font-mono text-xs text-neutral-500">{attribute.code}</p>
                                            </div>
                                            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-600">
                                                {valueCount} değer
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {isSystemCustomerAttribute ? (
                                                <Badge className="border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
                                                    <Layers3 className="h-3 w-3" />
                                                    Sistem profil alanı
                                                </Badge>
                                            ) : null}
                                            {!isSystemCustomerAttribute && attribute.isCustomerAssignable ? (
                                                <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                                                    <UserRound className="h-3 w-3" />
                                                    Müşteri Profili
                                                </Badge>
                                            ) : null}
                                            {imageCount > 0 ? (
                                                <Badge variant="outline" className="gap-1 bg-neutral-50">
                                                    <ImageIcon className="h-3 w-3" />
                                                    {imageCount} görsel
                                                </Badge>
                                            ) : null}
                                        </div>

                                        <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-3 text-sm">
                                            <span className="text-neutral-500">Değerleri ve görselleri yönet</span>
                                            <ArrowRight className="h-4 w-4 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-brand" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            <AdminListPagination
                page={currentPage}
                totalPages={totalPages}
                total={filteredAttributes.length}
                limit={filters.limit}
                itemLabel="özellik"
                onPageChange={setPage}
                onLimitChange={setLimit}
            />
        </div>
    )
}
