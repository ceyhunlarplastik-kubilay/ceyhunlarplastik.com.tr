import type { Category } from "@/features/public/categories/types"

export type ListCategoriesResponse = {
    statusCode: number
    payload: {
        data: Category[]
    }
}

export type GetCategoryResponse = {
    statusCode: number
    payload: {
        category: Category
    }
}

export type CreateCategoryResponse = {
    statusCode: number
    payload: {
        category: Category
    }
}

export type UpdateCategoryResponse = {
    statusCode: number
    payload: {
        category: Category
    }
}