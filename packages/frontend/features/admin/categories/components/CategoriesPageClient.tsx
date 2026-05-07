"use client";

import { useMemo } from "react";
import { useCategories } from "../hooks/useCategories";
import { CategoriesTable } from "./CategoriesTable";
import { Spinner } from "@/components/ui/spinner";
import { CategoriesFilters } from "@/features/admin/categories/components/CategoriesFilters";
import { useCategoryListFilters } from "@/features/admin/categories/hooks/useCategoryListFilters";
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar";

export function CategoriesPageClient() {
    const {
        filters,
        setSearch,
        setRefreshIntervalSeconds,
    } = useCategoryListFilters()

    const { data, isLoading, isError, isFetching, refetch, dataUpdatedAt } = useCategories({
        autoRefreshIntervalMs: filters.refreshIntervalSeconds > 0
            ? filters.refreshIntervalSeconds * 1000
            : false,
    });

    const filteredCategories = useMemo(() => {
        const normalizedSearch = filters.search.trim().toLocaleLowerCase("tr-TR")
        const categories = data ?? []

        if (!normalizedSearch) return categories

        return categories.filter((category) =>
            `${category.code} ${category.name} ${category.slug}`
                .toLocaleLowerCase("tr-TR")
                .includes(normalizedSearch)
        )
    }, [data, filters.search])

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
                    Toplam <span className="font-semibold text-neutral-900">{filteredCategories.length}</span> kategori
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

            <CategoriesTable categories={filteredCategories} />
        </div>
    );
}
