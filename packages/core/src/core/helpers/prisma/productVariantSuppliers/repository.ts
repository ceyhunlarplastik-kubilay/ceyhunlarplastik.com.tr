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

    return {
        listProductVariantSuppliers,
        getProductVariantSupplier,
        createProductVariantSupplier,
        updateProductVariantSupplier,
        deleteProductVariantSupplier,
    }
}
