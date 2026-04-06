import { prisma } from "@/core/db/prisma"
import { Prisma, ProductAttribute } from "@/prisma/generated/prisma/client"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"

type ProductAttributeForFilter = {
    id: string
    code: string
    name: string
    values: {
        id: string
        name: string
        slug: string
        parentValueId: string | null
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

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const listAttributesWithValues = async () => {
        return prisma.productAttribute.findMany({
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
    }

    const listAttributesForFilter = async () => {
        return prisma.productAttribute.findMany({
            where: { isActive: true },
            select: {
                id: true,
                code: true,
                name: true,
                values: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        parentValueId: true,
                    },
                    orderBy: { displayOrder: "asc" }
                }
            },
            orderBy: { displayOrder: "asc" }
        })
    }

    const getProductAttribute = (id: string) =>
        prisma.productAttribute.findUniqueOrThrow({
            where: { id },
        })

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
