/* import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import { buildFilterQuery } from "@/core/helpers/filters/buildFilterQuery"
import { INDUSTRIAL_ATTRIBUTE_CODES } from "@/core/helpers/products/productIndustrialUsages"

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
import { INDUSTRIAL_ATTRIBUTE_CODES } from "@/core/helpers/products/productIndustrialUsages"

import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import { Prisma, Product } from "@/prisma/generated/prisma/client"

const productAttributeTranslationsSelect = {
    orderBy: { locale: "asc" },
    select: {
        id: true,
        locale: true,
        name: true,
        createdAt: true,
        updatedAt: true,
    },
} as const

const productAttributeValueTranslationsSelect = {
    orderBy: { locale: "asc" },
    select: {
        id: true,
        locale: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
    },
} as const

const productAttributeInclude = {
    include: {
        translations: productAttributeTranslationsSelect,
    },
} as const

// Ürün attribute değerleri (model_type vb.) küçük sözlük kayıtlarıdır;
// enrich/badge akışları parentValue zincirini kullandığı için shape korunur.
const attributeValuesInclude = {
    include: {
        attribute: productAttributeInclude,
        translations: productAttributeValueTranslationsSelect,
        parentValue: {
            include: {
                attribute: productAttributeInclude,
                translations: productAttributeValueTranslationsSelect,
                parentValue: {
                    include: {
                        attribute: productAttributeInclude,
                        translations: productAttributeValueTranslationsSelect,
                    },
                },
            },
        },
    },
} as const

// industrialUsages değerlerinde derin attribute/parentValue zincirleri taşınmaz:
// public kullanım tablosu yalnız name, admin formu yalnız *ValueId okur. Derin
// zincir 138 usage'lı üründe ~0.5MB/ürün üretip Lambda 6MB yanıt limitini aşıyordu.
const industrialUsageValueSelect = {
    id: true,
    name: true,
    slug: true,
    translations: productAttributeValueTranslationsSelect,
    attribute: {
        select: {
            id: true,
            code: true,
            name: true,
            translations: productAttributeTranslationsSelect,
        },
    },
} as const

const categoryInclude = {
    include: {
        translations: true,
    },
} as const

const baseInclude = {
    category: categoryInclude,
    assets: true,
    attributeValues: attributeValuesInclude,
    industrialUsages: {
        orderBy: {
            displayOrder: "asc",
        },
        include: {
            sectorValue: { select: industrialUsageValueSelect },
            productionGroupValue: { select: industrialUsageValueSelect },
            usageAreaValue: { select: industrialUsageValueSelect },
        },
    },
} satisfies Prisma.ProductInclude

// Card görünümü (public liste yüzeyleri): industrialUsages hiç taşınmaz.
const listCardInclude = {
    category: categoryInclude,
    assets: true,
    attributeValues: attributeValuesInclude,
} satisfies Prisma.ProductInclude

export type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof baseInclude }>

export type ProductListItem = Prisma.ProductGetPayload<{ include: typeof listCardInclude }> & {
    industrialUsages?: ProductWithRelations["industrialUsages"]
}

export type ProductListView = "card" | "full"

export interface IPrismaProductRepository {
    listProducts(
        query: IPaginationQuery & { categoryId?: string; category?: string },
        options?: { view?: ProductListView },
    ): Promise<{
        data: ProductListItem[]
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

    const listProducts = async (
        query: IPaginationQuery & { categoryId?: string; category?: string },
        options?: { view?: ProductListView },
    ) => {
        // Cast: iki include de baseInclude'un alt kümesi; Prisma.ProductInclude
        // anotasyonu tsc'de aşırı derin tip karşılaştırmasına yol açıyor.
        const listInclude = (
            options?.view === "card" ? listCardInclude : baseInclude
        ) as typeof baseInclude

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

        const buildFilterValues = (rawValue: unknown) => {
            if (Array.isArray(rawValue)) {
                return rawValue
                    .flatMap((value) => String(value).split(","))
                    .map((value) => value.trim())
                    .filter(Boolean)
            }

            return typeof rawValue === "string"
                ? rawValue.split(",").map((v) => v.trim()).filter(Boolean)
                : []
        }

        const buildAttributeWhere = (attrCode: string, rawValue: unknown): Prisma.ProductWhereInput | null => {
            const values = buildFilterValues(rawValue)

            if (values.length === 0) return null

            if (attrCode === INDUSTRIAL_ATTRIBUTE_CODES.sector) {
                return {
                    industrialUsages: {
                        some: {
                            OR: [
                                {
                                    sectorValue: {
                                        attribute: { code: INDUSTRIAL_ATTRIBUTE_CODES.sector },
                                        slug: { in: values },
                                    },
                                },
                                {
                                    productionGroupValue: {
                                        attribute: { code: INDUSTRIAL_ATTRIBUTE_CODES.productionGroup },
                                        parentValue: {
                                            attribute: { code: INDUSTRIAL_ATTRIBUTE_CODES.sector },
                                            slug: { in: values },
                                        },
                                    },
                                },
                                {
                                    usageAreaValue: {
                                        attribute: { code: INDUSTRIAL_ATTRIBUTE_CODES.usageArea },
                                        parentValue: {
                                            attribute: { code: INDUSTRIAL_ATTRIBUTE_CODES.productionGroup },
                                            parentValue: {
                                                attribute: { code: INDUSTRIAL_ATTRIBUTE_CODES.sector },
                                                slug: { in: values },
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                }
            }

            if (attrCode === INDUSTRIAL_ATTRIBUTE_CODES.productionGroup) {
                return {
                    industrialUsages: {
                        some: {
                            OR: [
                                {
                                    productionGroupValue: {
                                        attribute: { code: INDUSTRIAL_ATTRIBUTE_CODES.productionGroup },
                                        slug: { in: values },
                                    },
                                },
                                {
                                    usageAreaValue: {
                                        attribute: { code: INDUSTRIAL_ATTRIBUTE_CODES.usageArea },
                                        parentValue: {
                                            attribute: { code: INDUSTRIAL_ATTRIBUTE_CODES.productionGroup },
                                            slug: { in: values },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                }
            }

            if (attrCode === INDUSTRIAL_ATTRIBUTE_CODES.usageArea) {
                return {
                    industrialUsages: {
                        some: {
                            usageAreaValue: {
                                attribute: { code: INDUSTRIAL_ATTRIBUTE_CODES.usageArea },
                                slug: { in: values },
                            },
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

        let data: ProductListItem[] = []
        let total = 0

        if (sortByCode) {
            // Natural code sort için önce hafif payload (id+code) çek, sonra sadece sayfalı veriyi include ile al.
            const allCodes = await prisma.product.findMany({
                where: finalWhere,
                select: {
                    id: true,
                    code: true,
                },
            })

            allCodes.sort((left, right) => {
                const cmp = naturalCodeCompare(left.code, right.code)
                return sortDirection === "desc" ? -cmp : cmp
            })

            total = allCodes.length

            const pagedIds = allCodes.slice(skip, skip + take).map((item) => item.id)
            if (pagedIds.length === 0) {
                data = []
            } else {
                const pagedData = (await prisma.product.findMany({
                    where: { id: { in: pagedIds } },
                    include: listInclude,
                })) as unknown as ProductListItem[]

                const orderMap = new Map(pagedIds.map((id, index) => [id, index]))
                data = pagedData.sort(
                    (left, right) =>
                        (orderMap.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
                        (orderMap.get(right.id) ?? Number.MAX_SAFE_INTEGER)
                )
            }
        } else {
            data = (await prisma.product.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
                include: listInclude,
            })) as unknown as ProductListItem[]
            total = await prisma.product.count({ where: finalWhere })
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
