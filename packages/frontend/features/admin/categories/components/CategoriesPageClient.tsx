"use client";

import { useCategories } from "../hooks/useCategories";
import { CategoriesTable } from "./CategoriesTable";
import { Spinner } from "@/components/ui/spinner";
import { CategoriesFilters } from "@/features/admin/categories/components/CategoriesFilters";
import { useCategoryListFilters } from "@/features/admin/categories/hooks/useCategoryListFilters";
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar";
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination";

export function CategoriesPageClient() {
    const {
        filters,
        params,
        setSearch,
        setPage,
        setLimit,
        setRefreshIntervalSeconds,
    } = useCategoryListFilters()

    const { data, isLoading, isError, isFetching, refetch, dataUpdatedAt } = useCategories({
        params,
        autoRefreshIntervalMs: filters.refreshIntervalSeconds > 0
            ? filters.refreshIntervalSeconds * 1000
            : false,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Spinner />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-sm text-red-500 p-6">
                Kategoriler yüklenemedi
            </div>
        );
    }

    const categories = data?.data ?? []
    const meta = data?.meta

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Kategoriler</h1>
                    <p className="text-sm text-neutral-500">
                        Kategori kayıtlarını arayın, düzenleyin ve asset/attribute ilişkilerini yönetin.
                    </p>
                </div>

                <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm lg:min-w-[220px]">
                    Toplam <span className="font-semibold text-neutral-900">{meta?.total ?? categories.length}</span> kategori
                </div>
            </div>

            <CategoriesFilters search={filters.search} onSearchChange={setSearch} />

            <AdminListRefreshBar
                dataUpdatedAt={dataUpdatedAt}
                isFetching={isFetching}
                onRefresh={() => void refetch()}
                refreshIntervalSeconds={filters.refreshIntervalSeconds}
                onRefreshIntervalChange={setRefreshIntervalSeconds}
            />

            <CategoriesTable categories={categories} />

            <AdminListPagination
                page={filters.page}
                limit={filters.limit}
                total={meta?.total}
                totalPages={meta?.totalPages}
                itemLabel="kategori"
                onPageChange={setPage}
                onLimitChange={setLimit}
            />
        </div>
    );
}
