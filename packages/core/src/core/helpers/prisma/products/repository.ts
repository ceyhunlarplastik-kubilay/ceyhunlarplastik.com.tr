import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import { buildFilterQuery } from "@/core/helpers/filters/buildFilterQuery"

import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import { Prisma, Product } from "@/prisma/generated/prisma/client"

export type ProductWithCategory = Prisma.ProductGetPayload<{
    include: { category: true }
}>

export interface IPrismaProductRepository {
    listProducts(query: IPaginationQuery & { categoryId?: string }): Promise<{
        data: Product[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    getProduct(id: string): Promise<ProductWithCategory | null>
    getProductBySlug(slug: string): Promise<ProductWithCategory | null>
    createProduct(data: Prisma.ProductCreateInput): Promise<Product>
    updateProduct(id: string, data: Prisma.ProductUpdateInput): Promise<Product>
    deleteProduct(id: string): Promise<Product>
}

export const productRepository = (): IPrismaProductRepository => {

    const listProducts = async (query: IPaginationQuery & { categoryId?: string }) => {

        const filterWhere = buildFilterQuery<Product>(query, [
            "name",
            "code",
        ])

        const {
            where,
            orderBy,
            skip,
            take,
            page,
            limit,
        } = buildPaginationQuery<Product>(query, {
            searchableFields: ["name", "code"],
            defaultSort: "code",
        })

        const finalWhere = {
            ...where,
            ...filterWhere,
            ...(query.categoryId && { categoryId: query.categoryId }),
        }

        const [data, total] = await Promise.all([
            prisma.product.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
                include: {
                    category: true,
                    assets: true,
                }
            }),
            prisma.product.count({ where: finalWhere }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const getProduct = async (id: string) =>
        prisma.product.findUniqueOrThrow({
            where: { id },
            include: {
                category: true,
                assets: true,
            },
        })

    const getProductBySlug = async (slug: string) =>
        prisma.product.findUniqueOrThrow({
            where: { slug },
            include: {
                category: true,
                assets: true,
            },
        })

    const createProduct = async (data: Prisma.ProductCreateInput) =>
        prisma.product.create({
            data,
            include: {
                category: true,
                assets: true,
            },
        })

    const updateProduct = async (id: string, data: Prisma.ProductUpdateInput) =>
        prisma.product.update({
            where: { id },
            data,
            include: {
                category: true,
                assets: true,
            },
        })

    const deleteProduct = async (id: string) =>
        prisma.product.delete({
            where: { id },
            include: {
                category: true,
                assets: true,
            },
        })

    return {
        listProducts,
        getProduct,
        getProductBySlug,
        createProduct,
        updateProduct,
        deleteProduct,
    }
}
