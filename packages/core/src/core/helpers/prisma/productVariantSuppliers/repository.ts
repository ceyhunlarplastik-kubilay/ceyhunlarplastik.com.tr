import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"

import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import { Prisma, ProductVariantSupplier } from "@/prisma/generated/prisma/client"

export type ProductVariantSupplierWithRelations = Prisma.ProductVariantSupplierGetPayload<{
    include: {
        variant: {
            include: {
                product: {
                    include: {
                        category: true
                    }
                }
            }
        }
        supplier: true
    }
}>

export interface IPrismaProductVariantSupplierRepository {
    listProductVariantSuppliers(query: IPaginationQuery & { variantId?: string, supplierId?: string, productId?: string, categoryId?: string }): Promise<{
        data: ProductVariantSupplierWithRelations[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    getProductVariantSupplier(id: string): Promise<ProductVariantSupplierWithRelations | null>
    createProductVariantSupplier(data: Prisma.ProductVariantSupplierCreateInput): Promise<ProductVariantSupplierWithRelations>
    updateProductVariantSupplier(id: string, data: Prisma.ProductVariantSupplierUpdateInput): Promise<ProductVariantSupplierWithRelations>
    deleteProductVariantSupplier(id: string): Promise<ProductVariantSupplierWithRelations>
    listProductsBySupplier(query: IPaginationQuery & { supplierId?: string, categoryId?: string }): Promise<{
        data: Array<{
            id: string
            code: string
            name: string
            slug: string
            categoryId: string
            createdAt: Date
            updatedAt: Date
            category: {
                id: string
                code: number
                name: string
                slug: string
            }
            assets: Array<{
                id: string
                role: string
                url: string
            }>
            variantCount: number
        }>
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    bulkUpdatePricingByProduct(input: {
        productId: string
        supplierId?: string
        operationalCostRate?: number
        profitRate?: number
    }): Promise<{ count: number }>
}

export const productVariantSupplierRepository = (): IPrismaProductVariantSupplierRepository => {

    const listProductVariantSuppliers = async (query: IPaginationQuery & { variantId?: string, supplierId?: string, productId?: string, categoryId?: string }) => {
        const {
            where,
            orderBy,
            skip,
            take,
            page,
            limit,
        } = buildPaginationQuery<ProductVariantSupplier>(query, {
            searchableFields: [],
            defaultSort: "createdAt",
        })

        const finalWhere = {
            ...where,
            ...(query.variantId && { variantId: query.variantId }),
            ...(query.supplierId && { supplierId: query.supplierId }),
            ...((query.productId || query.categoryId) && {
                variant: {
                    ...(query.productId && { productId: query.productId }),
                    ...(query.categoryId && { product: { categoryId: query.categoryId } }),
                },
            }),
            ...(query.search && {
                OR: [
                    { variant: { name: { contains: query.search, mode: "insensitive" } } },
                    { variant: { fullCode: { contains: query.search, mode: "insensitive" } } },
                    { supplier: { name: { contains: query.search, mode: "insensitive" } } },
                ],
            }),
        }

        const [data, total] = await Promise.all([
            prisma.productVariantSupplier.findMany({
                where: finalWhere,
                orderBy,
                skip,
                take,
                include: {
                    variant: {
                        include: {
                            product: {
                                include: {
                                    category: true,
                                },
                            },
                        },
                    },
                    supplier: true,
                }
            }),
            prisma.productVariantSupplier.count({ where: finalWhere }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const getProductVariantSupplier = async (id: string) =>
        prisma.productVariantSupplier.findUnique({
            where: { id },
            include: {
                variant: {
                    include: {
                        product: {
                            include: {
                                category: true,
                            },
                        },
                    },
                },
                supplier: true,
            }
        })

    const createProductVariantSupplier = async (data: Prisma.ProductVariantSupplierCreateInput) => {
        // If isActive is true, we must deactivate other suppliers for this variant
        if (data.isActive && data.variant.connect?.id) {
            return prisma.$transaction(async (tx) => {
                await tx.productVariantSupplier.updateMany({
                    where: {
                        variantId: data.variant.connect?.id,
                        isActive: true,
                    },
                    data: { isActive: false },
                });

                return tx.productVariantSupplier.create({
                    data,
                    include: {
                        variant: {
                            include: {
                                product: {
                                    include: {
                                        category: true,
                                    },
                                },
                            },
                        },
                        supplier: true,
                    }
                });
            });
        }

        return prisma.productVariantSupplier.create({
            data,
            include: {
                variant: {
                    include: {
                        product: {
                            include: {
                                category: true,
                            },
                        },
                    },
                },
                supplier: true,
            }
        })
    }

    const updateProductVariantSupplier = async (id: string, data: Prisma.ProductVariantSupplierUpdateInput) => {
        // If setting isActive to true, deactivate others
        if (data.isActive === true) {
            const existing = await prisma.productVariantSupplier.findUnique({ where: { id } });
            if (existing) {
                return prisma.$transaction(async (tx) => {
                    await tx.productVariantSupplier.updateMany({
                        where: {
                            variantId: existing.variantId,
                            isActive: true,
                            id: { not: id } // Don't turn off myself if I'm already active (redundant but safe)
                        },
                        data: { isActive: false },
                    });

                    return tx.productVariantSupplier.update({
                        where: { id },
                        data,
                        include: {
                            supplier: true,
                            variant: {
                                include: {
                                    product: {
                                        include: {
                                            category: true,
                                        },
                                    },
                                },
                            },
                        }
                    });
                });
            }
        }

        return prisma.productVariantSupplier.update({
            where: { id },
            data,
            include: {
                supplier: true,
                variant: {
                    include: {
                        product: {
                            include: {
                                category: true,
                            },
                        },
                    },
                },
            }
        })
    }

    const deleteProductVariantSupplier = async (id: string) =>
        prisma.productVariantSupplier.delete({
            where: { id },
            include: {
                variant: {
                    include: {
                        product: {
                            include: {
                                category: true,
                            },
                        },
                    },
                },
                supplier: true,
            }
        })

    const listProductsBySupplier = async (query: IPaginationQuery & { supplierId?: string, categoryId?: string }) => {
        const page = query.page && query.page > 0 ? query.page : 1
        const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20
        const skip = (page - 1) * limit
        const order = query.order === "desc" ? "desc" : "asc"

        const productWhere = {
            ...(query.search
                ? {
                    OR: [
                        { name: { contains: query.search, mode: "insensitive" as const } },
                        { code: { contains: query.search, mode: "insensitive" as const } },
                    ],
                }
                : {}),
            ...(query.categoryId ? { categoryId: query.categoryId } : {}),
            variants: {
                some: {
                    variantSuppliers: {
                        some: {
                            ...(query.supplierId ? { supplierId: query.supplierId } : {}),
                        },
                    },
                },
            },
        }

        const [rows, total] = await Promise.all([
            prisma.product.findMany({
                where: productWhere,
                orderBy: (query.sort === "updatedAt" || query.sort === "createdAt" || query.sort === "name" || query.sort === "code")
                    ? { [query.sort]: order }
                    : { name: "asc" },
                skip,
                take: limit,
                include: {
                    category: true,
                    assets: {
                        select: {
                            id: true,
                            role: true,
                            key: true,
                        },
                        orderBy: { createdAt: "desc" },
                    },
                    variants: {
                        where: {
                            variantSuppliers: {
                                some: {
                                    ...(query.supplierId ? { supplierId: query.supplierId } : {}),
                                },
                            },
                        },
                        select: { id: true },
                    },
                },
            }),
            prisma.product.count({ where: productWhere }),
        ])

        const data = rows.map((row) => ({
            id: row.id,
            code: row.code,
            name: row.name,
            slug: row.slug,
            categoryId: row.categoryId,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            category: row.category,
            assets: row.assets.map((asset) => ({
                id: asset.id,
                role: asset.role,
                url: `${process.env.ASSET_PUBLIC_BASE_URL ?? ""}/${asset.key}`,
            })),
            variantCount: row.variants.length,
        }))

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const bulkUpdatePricingByProduct = async (input: {
        productId: string
        supplierId?: string
        operationalCostRate?: number
        profitRate?: number
    }) => {
        const rows = await prisma.productVariantSupplier.findMany({
            where: {
                ...(input.supplierId ? { supplierId: input.supplierId } : {}),
                variant: {
                    productId: input.productId,
                },
            },
            select: {
                id: true,
                price: true,
                operationalCostRate: true,
                profitRate: true,
            },
        })

        if (rows.length === 0) {
            return { count: 0 }
        }

        await prisma.$transaction(
            rows.map((row) => {
                const resolvedOperationalRate =
                    typeof input.operationalCostRate === "number"
                        ? input.operationalCostRate
                        : row.operationalCostRate
                            ? Number(row.operationalCostRate)
                            : 0

                const resolvedProfitRate =
                    typeof input.profitRate === "number"
                        ? input.profitRate
                        : row.profitRate
                            ? Number(row.profitRate)
                            : undefined

                const hamMaliyet = Number(row.price)
                const netCost = hamMaliyet * (1 + Number(resolvedOperationalRate ?? 0) / 100)
                const listPrice =
                    resolvedProfitRate !== undefined
                        ? netCost * (1 + Number(resolvedProfitRate) / 100)
                        : undefined

                return prisma.productVariantSupplier.update({
                    where: { id: row.id },
                    data: {
                        ...(typeof input.operationalCostRate === "number"
                            ? { operationalCostRate: input.operationalCostRate }
                            : {}),
                        ...(typeof input.profitRate === "number"
                            ? { profitRate: input.profitRate }
                            : {}),
                        netCost,
                        ...(listPrice !== undefined ? { listPrice } : {}),
                        pricingUpdatedAt: new Date(),
                    },
                })
            })
        )

        return { count: rows.length }
    }

    return {
        listProductVariantSuppliers,
        getProductVariantSupplier,
        createProductVariantSupplier,
        updateProductVariantSupplier,
        deleteProductVariantSupplier,
        listProductsBySupplier,
        bulkUpdatePricingByProduct,
    }
}
