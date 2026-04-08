/* import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import { buildFilterQuery } from "@/core/helpers/filters/buildFilterQuery"

import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import { Prisma, Product } from "@/prisma/generated/prisma/client"

export type ProductWithCategory = Prisma.ProductGetPayload<{
    include: { category: true }
}>

export interface IPrismaProductRepository {
    listProducts(query: IPaginationQuery & { categoryId?: string; category?: string }): Promise<{
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

    const listProducts = async (query: IPaginationQuery & { categoryId?: string; category?: string }) => {

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
 */

import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import { buildFilterQuery } from "@/core/helpers/filters/buildFilterQuery"

import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import { Prisma, Product } from "@/prisma/generated/prisma/client"

export type ProductWithRelations = Prisma.ProductGetPayload<{
    include: {
        category: true
        assets: true
        attributeValues: {
            include: {
                attribute: true
                parentValue: {
                    include: {
                        attribute: true
                        parentValue: {
                            include: {
                                attribute: true
                            }
                        }
                    }
                }
            }
        }
    }
}>

export interface IPrismaProductRepository {
    listProducts(query: IPaginationQuery & { categoryId?: string; category?: string }): Promise<{
        data: ProductWithRelations[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    getProduct(id: string): Promise<ProductWithRelations>
    getProductBySlug(slug: string): Promise<ProductWithRelations>
    createProduct(data: Prisma.ProductCreateInput): Promise<ProductWithRelations>
    updateProduct(id: string, data: Prisma.ProductUpdateInput): Promise<ProductWithRelations>
    deleteProduct(id: string): Promise<ProductWithRelations>
}

export const productRepository = (): IPrismaProductRepository => {

    const baseInclude = {
        category: true,
        assets: true,
        attributeValues: {
            include: {
                attribute: true,
                parentValue: {
                    include: {
                        attribute: true,
                        parentValue: {
                            include: {
                                attribute: true,
                            },
                        },
                    },
                },
            }
        }
    } satisfies Prisma.ProductInclude

    const listProducts = async (query: IPaginationQuery & { categoryId?: string; category?: string }) => {

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

        const buildAttributeWhere = (attrCode: string, rawValue: unknown): Prisma.ProductWhereInput | null => {
            const values = typeof rawValue === "string"
                ? rawValue.split(",").map((v) => v.trim()).filter(Boolean)
                : []

            if (values.length === 0) return null

            if (attrCode === "sector") {
                return {
                    attributeValues: {
                        some: {
                            OR: [
                                {
                                    attribute: { code: "sector" },
                                    slug: { in: values },
                                },
                                {
                                    attribute: { code: "production_group" },
                                    parentValue: {
                                        attribute: { code: "sector" },
                                        slug: { in: values },
                                    },
                                },
                                {
                                    attribute: { code: "usage_area" },
                                    parentValue: {
                                        attribute: { code: "production_group" },
                                        parentValue: {
                                            attribute: { code: "sector" },
                                            slug: { in: values },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                }
            }

            if (attrCode === "production_group") {
                return {
                    attributeValues: {
                        some: {
                            OR: [
                                {
                                    attribute: { code: "production_group" },
                                    slug: { in: values },
                                },
                                {
                                    attribute: { code: "usage_area" },
                                    parentValue: {
                                        attribute: { code: "production_group" },
                                        slug: { in: values },
                                    },
                                },
                            ],
                        },
                    },
                }
            }

            return {
                attributeValues: {
                    some: {
                        attribute: {
                            code: attrCode,
                        },
                        slug: {
                            in: values,
                        },
                    },
                },
            }
        }

        const attributeWhereClauses = (query.attributeFilters ?? [])
            .map(([attrCode, value]) => buildAttributeWhere(attrCode, value))
            .filter((clause): clause is Prisma.ProductWhereInput => Boolean(clause))

        const finalWhere: Prisma.ProductWhereInput = {
            ...where,
            ...filterWhere,
            ...(query.categoryId && { categoryId: query.categoryId }),
            ...(query.category && {
                category: {
                    slug: query.category
                }
            }),
            ...(attributeWhereClauses.length > 0 && {
                AND: attributeWhereClauses,
            }),
        }

        const naturalCodeCompare = (a: string, b: string) =>
            a.localeCompare(b, "tr", {
                numeric: true,
                sensitivity: "base",
            })

        const sortByCode = (query.sort ?? "code") === "code"
        const sortDirection: "asc" | "desc" = query.order === "desc" ? "desc" : "asc"

        let data: ProductWithRelations[] = []
        let total = 0

        if (sortByCode) {
            const all = await prisma.product.findMany({
                where: finalWhere,
                include: baseInclude,
            })

            all.sort((left, right) => {
                const cmp = naturalCodeCompare(left.code, right.code)
                return sortDirection === "desc" ? -cmp : cmp
            })

            total = all.length
            data = all.slice(skip, skip + take)
        } else {
            const [pagedData, counted] = await Promise.all([
                prisma.product.findMany({
                    where: finalWhere,
                    orderBy,
                    skip,
                    take,
                    include: baseInclude,
                }),
                prisma.product.count({ where: finalWhere }),
            ])

            data = pagedData
            total = counted
        }

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const getProduct = (id: string) =>
        prisma.product.findUniqueOrThrow({
            where: { id },
            include: baseInclude
        })

    const getProductBySlug = (slug: string) =>
        prisma.product.findUniqueOrThrow({
            where: { slug },
            include: baseInclude
        })

    const createProduct = (data: Prisma.ProductCreateInput) =>
        prisma.product.create({
            data,
            include: baseInclude
        })

    const updateProduct = (id: string, data: Prisma.ProductUpdateInput) =>
        prisma.product.update({
            where: { id },
            data,
            include: baseInclude
        })

    const deleteProduct = (id: string) =>
        prisma.product.delete({
            where: { id },
            include: baseInclude
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
