import type { Category } from "@/features/public/categories/types"

export function getCategoryPrimaryImage(category: Category) {
    return category.assets?.find((a) => a.role === "PRIMARY")?.url ?? null
}

export function getCategoryAnimationImage(category: Category) {
    return category.assets?.find((a) => a.role === "ANIMATION")?.url ?? null
}