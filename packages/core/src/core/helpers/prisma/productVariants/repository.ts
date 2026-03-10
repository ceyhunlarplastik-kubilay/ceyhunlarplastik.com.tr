import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import { buildFilterQuery } from "@/core/helpers/filters/buildFilterQuery"

import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import { Prisma, ProductVariant } from "@/prisma/generated/prisma/client"

export type ProductVariantWithRelations = Prisma.ProductVariantGetPayload<{
    include: {
        product: true
        color: true
        materials: true
        variantSuppliers: {
            include: {
                supplier: true
            }
        }
        measurements: {
            include: {
                measurementType: true
            }
        }
    }
}>

export interface IPrismaProductVariantRepository {
    listProductVariants(query: IPaginationQuery & { productId?: string }): Promise<{
        data: ProductVariantWithRelations[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    getProductVariant(id: string): Promise<ProductVariantWithRelations | null>
    countProductVariants(productId: string, versionCode: string): Promise<number>
    createProductVariant(data: Prisma.ProductVariantCreateInput): Promise<ProductVariant>
    updateProductVariant(id: string, data: Prisma.ProductVariantUpdateInput): Promise<ProductVariant>
    deleteProductVariant(id: string): Promise<ProductVariant>
    getProductVariantTableData(productId: string): Promise<any[]>
}

const defaultInclude = {
    product: true,
    color: true,
    materials: true,
    variantSuppliers: {
        include: { supplier: true }
    },
    measurements: {
        include: { measurementType: true }
    }
} satisfies Prisma.ProductVariantInclude

export const productVariantRepository = (): IPrismaProductVariantRepository => {

    const listProductVariants = async (query: IPaginationQuery & { productId?: string }) => {

        const filterWhere = buildFilterQuery<ProductVariant>(query, [
            "fullCode",
            "name",
        ])

        const {
            where,
            orderBy,
            skip,
            take,
            page,
            limit,
        } = buildPaginationQuery<ProductVariant>(query, {
            searchableFields: ["fullCode", "name"],
            defaultSort: "createdAt",
        })

        const finalWhere = {
            ...where,
            ...filterWhere,
            ...(query.productId && { productId: query.productId }),
        }

        const [data, total] = await Promise.all([
            prisma.productVariant.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
                include: defaultInclude
            }),
            prisma.productVariant.count({ where: finalWhere }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const getProductVariant = async (id: string) =>
        prisma.productVariant.findUnique({
            where: { id },
            include: defaultInclude
        })

    const countProductVariants = async (productId: string, versionCode: string) =>
        prisma.productVariant.count({ where: { productId, versionCode } })

    const createProductVariant = async (data: Prisma.ProductVariantCreateInput) =>
        prisma.productVariant.create({
            data,
            include: defaultInclude
        })

    const updateProductVariant = async (id: string, data: Prisma.ProductVariantUpdateInput) =>
        prisma.productVariant.update({
            where: { id },
            data,
            include: defaultInclude
        })

    const deleteProductVariant = async (id: string) =>
        prisma.productVariant.delete({
            where: { id },
            include: defaultInclude,
        })

    const getProductVariantTableData = async (productId: string) => {
        return prisma.productVariant.findMany({
            where: { productId },
            include: {
                color: true,
                materials: true,
                measurements: {
                    include: {
                        measurementType: true
                    }
                }
            }
        })
    }

    return {
        listProductVariants,
        getProductVariant,
        countProductVariants,
        createProductVariant,
        updateProductVariant,
        deleteProductVariant,
        getProductVariantTableData,
    }
}
