
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import type { Category } from "@/features/public/categories/types";
import {
    fetchCategories,
    fetchCategoryById,
} from "@/features/public/categories/api/fetchCategories";

export function useCategories(initialData?: Category[]) {
    const locale = useLocale();

    return useQuery({
        queryKey: ["categories", locale],
        queryFn: () => fetchCategories(locale),
        staleTime: 5 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        retry: 1,
        // Server'da (Navbar) zaten çekilen kategoriler prop olarak geldiğinde ilk
        // client fetch'i atlanır; staleTime içinde ikinci /categories isteği gitmez.
        initialData,
    });
}

export function useCategory(id: string) {
    const locale = useLocale();

    return useQuery({
        queryKey: ["category", id, locale],
        queryFn: () => fetchCategoryById(id, locale),
        enabled: !!id,
    });
}
