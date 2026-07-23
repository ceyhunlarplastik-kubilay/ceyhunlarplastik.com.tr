"use client"

import { motion } from "motion/react"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar"
import { MaterialsTable } from "@/features/admin/materials/components/MaterialsTable"
import { useMaterialListFilters } from "@/features/admin/materials/hooks/useMaterialListFilters"
import { useMaterials } from "@/features/admin/materials/hooks/useMaterials"

export function MaterialsPageClient() {
    const {
        filters,
        params,
        setSearch,
        setCertificate,
        setPage,
        setLimit,
        setRefreshIntervalSeconds,
    } = useMaterialListFilters()

    const { data, isLoading, isError, isFetching, refetch, dataUpdatedAt } = useMaterials({
        params,
        autoRefreshIntervalMs: filters.refreshIntervalSeconds > 0
            ? filters.refreshIntervalSeconds * 1000
            : false,
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Spinner />
            </div>
        )
    }

    if (isError) {
        return <div className="p-6 text-sm text-red-500">Ham maddeler yüklenemedi</div>
    }

    const materials = data?.data ?? []
    const meta = data?.meta

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="space-y-6"
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Ham Maddeler</h1>
                    <p className="text-sm text-neutral-500">
                        Ham madde referanslarını ve müşteriye gösterilecek PDF sertifikalarını yönetin.
                    </p>
                </div>

                <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm lg:min-w-[220px]">
                    Toplam <span className="font-semibold text-neutral-900">{meta?.total ?? materials.length}</span> ham madde
                </div>
            </div>

            <div className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm lg:grid-cols-[minmax(260px,1fr)_220px]">
                <Input
                    value={filters.search}
                    onChange={(event) => void setSearch(event.target.value)}
                    placeholder="Ham madde adı veya kodu ile ara"
                />
                <Select value={filters.certificate} onValueChange={setCertificate}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sertifika" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm ham maddeler</SelectItem>
                        <SelectItem value="with-certificates">Sertifikalı olanlar</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <AdminListRefreshBar
                dataUpdatedAt={dataUpdatedAt}
                isFetching={isFetching}
                onRefresh={() => void refetch()}
                refreshIntervalSeconds={filters.refreshIntervalSeconds}
                onRefreshIntervalChange={setRefreshIntervalSeconds}
            />

            <MaterialsTable materials={materials} isFetching={isFetching} />

            <AdminListPagination
                page={filters.page}
                limit={filters.limit}
                total={meta?.total}
                totalPages={meta?.totalPages}
                itemLabel="ham madde"
                onPageChange={setPage}
                onLimitChange={setLimit}
            />
        </motion.div>
    )
}
