import type { Asset } from "@/features/public/assets/types"

export type MaterialTranslation = {
    id: string
    locale: string
    name: string
    createdAt: string
    updatedAt: string
}

export type Material = {
    id: string
    name: string
    translations?: MaterialTranslation[]
    code?: string | null
    assets?: Asset[]
    createdAt: string
    updatedAt: string
}

export type ListMaterialsResponse = {
    statusCode: number
    payload: {
        data: Material[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}

export type MaterialResponse = {
    statusCode: number
    payload: {
        material: Material
    }
}

export type PresignMaterialAssetResponse = {
    statusCode: number
    payload: {
        uploadUrl: string
        key: string
        url: string
    }
}
