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
import { ColorsTable } from "@/features/admin/colors/components/ColorsTable"
import { useColorListFilters } from "@/features/admin/colors/hooks/useColorListFilters"
import { useColors } from "@/features/admin/colors/hooks/useColors"

export function ColorsPageClient() {
    const {
        filters,
        params,
        setSearch,
        setSystem,
        setPage,
        setLimit,
        setRefreshIntervalSeconds,
    } = useColorListFilters()

    const { data, isLoading, isError, isFetching, refetch, dataUpdatedAt } = useColors({
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
        return <div className="p-6 text-sm text-red-500">Renkler yüklenemedi</div>
    }

    const colors = data?.data ?? []
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
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Renkler</h1>
                    <p className="text-sm text-neutral-500">
                        Ürün varyantlarında kullanılan renk sistemlerini, kodlarını ve çeviri adlarını yönetin.
                    </p>
                </div>

                <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm lg:min-w-[220px]">
                    Toplam <span className="font-semibold text-neutral-900">{meta?.total ?? colors.length}</span> renk
                </div>
            </div>

            <div className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm lg:grid-cols-[minmax(260px,1fr)_220px]">
                <Input
                    value={filters.search}
                    onChange={(event) => void setSearch(event.target.value)}
                    placeholder="Renk adı veya kodu ile ara"
                />
                <Select value={filters.system} onValueChange={setSystem}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sistem" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm sistemler</SelectItem>
                        <SelectItem value="RAL">RAL</SelectItem>
                        <SelectItem value="PANTONE">Pantone</SelectItem>
                        <SelectItem value="NCS">NCS</SelectItem>
                        <SelectItem value="CUSTOM">Özel</SelectItem>
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

            <ColorsTable colors={colors} isFetching={isFetching} />

            <AdminListPagination
                page={filters.page}
                limit={filters.limit}
                total={meta?.total}
                totalPages={meta?.totalPages}
                itemLabel="renk"
                onPageChange={setPage}
                onLimitChange={setLimit}
            />
        </motion.div>
    )
}
