import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"

import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import { Prisma, Asset, AssetType, AssetRole } from "@/prisma/generated/prisma/client"

export interface IPrismaAssetRepository {
    listAssets(query: IPaginationQuery): Promise<{
        data: Asset[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    getAsset(id: string): Promise<Asset | null>
    listAssetsByCategoryId(categoryId: string): Promise<Asset[]>
    listAssetsByMaterialId(materialId: string): Promise<Asset[]>
    listAssetsByProductAttributeValueId(productAttributeValueId: string): Promise<Asset[]>
    createAsset(data: Prisma.AssetCreateInput): Promise<Asset>
    createPendingAsset(data: Prisma.AssetCreateInput): Promise<Asset>
    confirmUploadedAsset(key: string): Promise<{ count: number; asset: Asset | null }>
    updateAsset(id: string, data: Prisma.AssetUpdateInput): Promise<Asset>
    deleteAsset(id: string): Promise<Asset>
    deleteAssetsByIds(ids: string[]): Promise<Prisma.BatchPayload>
    deleteCategoryAssetsByType(categoryId: string, type: AssetType): Promise<Prisma.BatchPayload>
    unsetCategoryPrimaryAssets(categoryId: string): Promise<Prisma.BatchPayload>
    unsetProductPrimaryAssets(categoryId: string): Promise<Prisma.BatchPayload>
    unsetProductAttributeValuePrimaryAssets(productAttributeValueId: string): Promise<Prisma.BatchPayload>
}

export const assetRepository = (): IPrismaAssetRepository => {

    const listAssets = async (query: IPaginationQuery) => {

        const {
            where,
            orderBy,
            skip,
            take,
            page,
            limit,
        } = buildPaginationQuery<Asset>(query, {
            searchableFields: ["key"],
            defaultSort: "createdAt",
        })

        const [data, total] = await Promise.all([
            prisma.asset.findMany({
                where,
                orderBy,
                skip,
                take,
                include: {
                    category: true,
                    product: true,
                    variant: true,
                    productAttributeValue: true,
                    material: true,
                }
            }),
            prisma.asset.count({ where }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const getAsset = async (id: string) =>
        prisma.asset.findUnique({
            where: { id },
            include: {
                category: true,
                product: true,
                variant: true,
                productAttributeValue: true,
                material: true,
            }
        })

    const listAssetsByCategoryId = async (categoryId: string) =>
        prisma.asset.findMany({
            where: { categoryId },
        })

    const listAssetsByMaterialId = async (materialId: string) =>
        prisma.asset.findMany({
            where: { materialId },
            orderBy: { createdAt: "desc" },
        })

    const listAssetsByProductAttributeValueId = async (productAttributeValueId: string) =>
        prisma.asset.findMany({
            where: { productAttributeValueId },
            orderBy: { createdAt: "desc" },
        })

    const createAsset = async (data: Prisma.AssetCreateInput) =>
        prisma.asset.create({ data })

    // Presign akışı: satır PENDING_UPLOAD olarak oluşturulur; S3 ObjectCreated
    // event'i confirmUploadedAsset ile ACTIVE'e çevirir. Diğer asset akışları
    // createAsset kullanmaya devam eder (varsayılan uploadStatus = ACTIVE).
    const createPendingAsset = async (data: Prisma.AssetCreateInput) =>
        prisma.asset.create({
            data: { ...data, uploadStatus: "PENDING_UPLOAD" },
        })

    // S3 ObjectCreated onayı. Guard idempotent + sıra-bağımsız: yalnız hâlâ
    // PENDING_UPLOAD olan satırı çevirir; tekrar teslim veya zaten ACTIVE = no-op
    // (count 0). Satırı geri döndürür ki çağıran PRIMARY rol kardeşlerini
    // düşürüp düşürmeyeceğine karar verebilsin.
    const confirmUploadedAsset = async (key: string) => {
        const { count } = await prisma.asset.updateMany({
            where: { key, uploadStatus: "PENDING_UPLOAD" },
            data: { uploadStatus: "ACTIVE", uploadedAt: new Date() },
        })

        const asset = await prisma.asset.findFirst({ where: { key } })

        return { count, asset }
    }

    const updateAsset = async (id: string, data: Prisma.AssetUpdateInput) =>
        prisma.asset.update({
            where: { id },
            data,
        })

    const deleteAsset = async (id: string) =>
        prisma.asset.delete({
            where: { id },
        })

    const deleteAssetsByIds = async (ids: string[]) => {
        if (ids.length === 0) {
            return { count: 0 }
        }

        return prisma.asset.deleteMany({
            where: {
                id: { in: ids },
            },
        })
    }

    const deleteCategoryAssetsByType = async (
        categoryId: string,
        type: AssetType
    ) => {
        return prisma.asset.deleteMany({
            where: {
                categoryId,
                type,
            },
        })
    }

    const unsetCategoryPrimaryAssets = async (categoryId: string) => {
        return prisma.asset.updateMany({
            where: {
                categoryId,
                role: "PRIMARY",
            },
            data: {
                role: "GALLERY",
            },
        })
    }

    const unsetProductPrimaryAssets = async (productId: string) => {
        return prisma.asset.updateMany({
            where: {
                productId,
                role: "PRIMARY",
            },
            data: {
                role: "GALLERY",
            },
        })
    }

    const unsetProductAttributeValuePrimaryAssets = async (productAttributeValueId: string) => {
        return prisma.asset.updateMany({
            where: {
                productAttributeValueId,
                role: "PRIMARY",
            },
            data: {
                role: "GALLERY",
            },
        })
    }

    return {
        listAssets,
        getAsset,
        listAssetsByCategoryId,
        listAssetsByMaterialId,
        listAssetsByProductAttributeValueId,
        createAsset,
        createPendingAsset,
        confirmUploadedAsset,
        updateAsset,
        deleteAsset,
        deleteAssetsByIds,
        deleteCategoryAssetsByType,
        unsetCategoryPrimaryAssets,
        unsetProductPrimaryAssets,
        unsetProductAttributeValuePrimaryAssets,
    }
}
