import { prisma } from "@/core/db/prisma"
import { Prisma, ProductAttribute } from "@/prisma/generated/prisma/client"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import { buildAssetUrl } from "@/core/helpers/assets/buildAssetUrl"
import { getEffectiveCustomerAssignable } from "@/core/helpers/productAttributes/customerAssignableAttributes"

type ProductAttributeForFilter = {
    id: string
    code: string
    name: string
    isCustomerAssignable: boolean
    values: {
        id: string
        name: string
        slug: string
        parentValueId: string | null
        assets: {
            id: string
            key: string
            mimeType: string
            type: string
            role: string
            url: string
        }[]
    }[]
}

export interface IPrismaProductAttributeRepository {
    listProductAttributes(query: IPaginationQuery): Promise<{
        data: ProductAttribute[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    listAttributesWithValues(): Promise<ProductAttribute[]>
    listAttributesForFilter(): Promise<ProductAttributeForFilter[]>
    getProductAttribute(id: string): Promise<ProductAttribute | null>
    createProductAttribute(data: Prisma.ProductAttributeCreateInput): Promise<ProductAttribute>
    updateProductAttribute(id: string, data: Prisma.ProductAttributeUpdateInput): Promise<ProductAttribute>
    deleteProductAttribute(id: string): Promise<ProductAttribute>
}

export const productAttributeRepository = (): IPrismaProductAttributeRepository => {
    const applyEffectiveCustomerAssignable = <T extends { code: string; isCustomerAssignable: boolean }>(attribute: T): T => ({
        ...attribute,
        isCustomerAssignable: getEffectiveCustomerAssignable(attribute),
    })

    const listProductAttributes = async (query: IPaginationQuery) => {

        const {
            where,
            orderBy,
            skip,
            take,
            page,
            limit,
        } = buildPaginationQuery<ProductAttribute>(query, {
            searchableFields: ["name"],
            defaultSort: "createdAt",
        })

        const [data, total] = await Promise.all([
            prisma.productAttribute.findMany({
                where,
                orderBy,
                skip,
                take,
            }),
            prisma.productAttribute.count({ where }),
        ])

        return buildPaginationResponse(data.map(applyEffectiveCustomerAssignable), {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const listAttributesWithValues = async () => {
        const attributes = await prisma.productAttribute.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                displayOrder: "asc",
            },
            include: {
                values: {
                    where: {
                        isActive: true,
                    },
                    orderBy: {
                        displayOrder: "asc",
                    },
                },
            },
        })

        return attributes.map(applyEffectiveCustomerAssignable)
    }

    const listAttributesForFilter = async () => {
        const attributes = await prisma.productAttribute.findMany({
            where: { isActive: true },
            select: {
                id: true,
                code: true,
                name: true,
                isCustomerAssignable: true,
                values: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        parentValueId: true,
                        assets: {
                            select: {
                                id: true,
                                key: true,
                                mimeType: true,
                                type: true,
                                role: true,
                            },
                            orderBy: { createdAt: "desc" }
                        }
                    },
                    orderBy: { displayOrder: "asc" }
                }
            },
            orderBy: { displayOrder: "asc" }
        })

        return attributes.map((attribute) => ({
            ...attribute,
            isCustomerAssignable: getEffectiveCustomerAssignable(attribute),
            values: attribute.values.map((value) => ({
                ...value,
                assets: value.assets.map((asset) => ({
                    ...asset,
                    url: buildAssetUrl(asset.key),
                })),
            })),
        }))
    }

    const getProductAttribute = async (id: string) => {
        const attribute = await prisma.productAttribute.findUniqueOrThrow({
            where: { id },
        })
        return applyEffectiveCustomerAssignable(attribute)
    }

    const createProductAttribute = (data: Prisma.ProductAttributeCreateInput) =>
        prisma.productAttribute.create({
            data,
        })

    const updateProductAttribute = (id: string, data: Prisma.ProductAttributeUpdateInput) =>
        prisma.productAttribute.update({
            where: { id },
            data,
        })

    const deleteProductAttribute = (id: string) =>
        prisma.productAttribute.delete({
            where: { id },
        })

    return {
        listProductAttributes,
        listAttributesWithValues,
        listAttributesForFilter,
        getProductAttribute,
        createProductAttribute,
        updateProductAttribute,
        deleteProductAttribute,
    }
}
