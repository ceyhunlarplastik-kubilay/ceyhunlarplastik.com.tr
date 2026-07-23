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
import { MEASUREMENT_TYPE_CODES } from "@/features/admin/measurementTypes/api/types"
import { MeasurementTypesTable } from "@/features/admin/measurementTypes/components/MeasurementTypesTable"
import { useMeasurementTypeListFilters } from "@/features/admin/measurementTypes/hooks/useMeasurementTypeListFilters"
import { useMeasurementTypes } from "@/features/admin/measurementTypes/hooks/useMeasurementTypes"

export function MeasurementTypesPageClient() {
    const {
        filters,
        params,
        setSearch,
        setCode,
        setBaseUnit,
        setPage,
        setLimit,
        setRefreshIntervalSeconds,
    } = useMeasurementTypeListFilters()

    const { data, isLoading, isError, isFetching, refetch, dataUpdatedAt } = useMeasurementTypes({
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
        return <div className="p-6 text-sm text-red-500">Ölçü tipleri yüklenemedi</div>
    }

    const measurementTypes = data?.data ?? []
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
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Ölçü Tipleri</h1>
                    <p className="text-sm text-neutral-500">
                        Ürün varyant tablolarındaki ölçü başlıklarını, kodlarını ve temel birimlerini yönetin.
                    </p>
                </div>

                <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm lg:min-w-[220px]">
                    Toplam <span className="font-semibold text-neutral-900">{meta?.total ?? measurementTypes.length}</span> ölçü tipi
                </div>
            </div>

            <div className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm lg:grid-cols-[minmax(260px,1fr)_180px_180px]">
                <Input
                    value={filters.search}
                    onChange={(event) => void setSearch(event.target.value)}
                    placeholder="Ölçü tipi adı, kodu veya birimi ile ara"
                />
                <Select value={filters.code} onValueChange={setCode}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Kod" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm kodlar</SelectItem>
                        {MEASUREMENT_TYPE_CODES.map((code) => (
                            <SelectItem key={code} value={code}>
                                {code}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    value={filters.baseUnit}
                    onChange={(event) => void setBaseUnit(event.target.value)}
                    placeholder="Birim"
                />
            </div>

            <AdminListRefreshBar
                dataUpdatedAt={dataUpdatedAt}
                isFetching={isFetching}
                onRefresh={() => void refetch()}
                refreshIntervalSeconds={filters.refreshIntervalSeconds}
                onRefreshIntervalChange={setRefreshIntervalSeconds}
            />

            <MeasurementTypesTable measurementTypes={measurementTypes} isFetching={isFetching} />

            <AdminListPagination
                page={filters.page}
                limit={filters.limit}
                total={meta?.total}
                totalPages={meta?.totalPages}
                itemLabel="ölçü tipi"
                onPageChange={setPage}
                onLimitChange={setLimit}
            />
        </motion.div>
    )
}
