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
    createAsset(data: Prisma.AssetCreateInput): Promise<Asset>
    updateAsset(id: string, data: Prisma.AssetUpdateInput): Promise<Asset>
    deleteAsset(id: string): Promise<Asset>
    deleteCategoryAssetsByType(categoryId: string, type: AssetType): Promise<Prisma.BatchPayload>
    unsetCategoryPrimaryAssets(categoryId: string): Promise<Prisma.BatchPayload>
    unsetProductPrimaryAssets(categoryId: string): Promise<Prisma.BatchPayload>
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
            }
        })

    const createAsset = async (data: Prisma.AssetCreateInput) =>
        prisma.asset.create({ data })

    const updateAsset = async (id: string, data: Prisma.AssetUpdateInput) =>
        prisma.asset.update({
            where: { id },
            data,
        })

    const deleteAsset = async (id: string) =>
        prisma.asset.delete({
            where: { id },
        })
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

    return {
        listAssets,
        getAsset,
        createAsset,
        updateAsset,
        deleteAsset,
        deleteCategoryAssetsByType,
        unsetCategoryPrimaryAssets,
        unsetProductPrimaryAssets
    }
}
