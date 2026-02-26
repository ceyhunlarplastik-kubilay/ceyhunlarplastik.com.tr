
import { useQuery } from "@tanstack/react-query";
import {
    fetchCategories,
    fetchCategoryById,
} from "@/features/public/categories/api/fetchCategories";

export function useCategories() {
    return useQuery({
        queryKey: ["categories"],
        queryFn: fetchCategories,
        staleTime: 5 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        retry: 1,
    });
}

export function useCategory(id: string) {
    return useQuery({
        queryKey: ["category", id],
        queryFn: () => fetchCategoryById(id),
        enabled: !!id,
    });
}
