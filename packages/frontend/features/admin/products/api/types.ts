import type { Product } from "@/features/public/products/types"

export type ListProductsResponse = {
    statusCode: number
    payload: {
        data: Product[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}

export type GetProductResponse = {
    statusCode: number
    payload: {
        product: Product
    }
}

export type CreateProductResponse = {
    statusCode: number
    payload: {
        product: Product
    }
}

export type UpdateProductResponse = {
    statusCode: number
    payload: {
        product: Product
    }
}

export type PresignProductAssetResponse = {
    statusCode: number
    payload: {
        uploadUrl: string
        key: string
        url: string
    }
}