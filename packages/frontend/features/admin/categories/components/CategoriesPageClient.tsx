"use client";

import { useCategories } from "../hooks/useCategories";
import { CategoriesTable } from "./CategoriesTable";
import { Spinner } from "@/components/ui/spinner";

export function CategoriesPageClient() {
    const { data, isLoading, isError } = useCategories();

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

    return <CategoriesTable categories={data ?? []} />;
}