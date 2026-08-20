import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import { buildFilterQuery } from "@/core/helpers/filters/buildFilterQuery"

import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import { Prisma, ProductVariant } from "@/prisma/generated/prisma/client"
import { colorTranslationSelect } from "@/core/helpers/prisma/colors/repository"
import { materialTranslationSelect } from "@/core/helpers/prisma/materials/repository"
import { measurementTypeTranslationSelect } from "@/core/helpers/prisma/measurementTypes/repository"

/**
 * Varyantın YAPISAL include'u: ölçü (size) ve versiyon (renk + hammadde).
 *
 * Ölçüler artık varyanta değil ürün modelinin ÖLÇÜ KAYDINA bağlı; renk/hammadde de
 * varyanta değil VERSİYONA bağlı. Okuyan taraf bunu bilmek zorunda kalmasın diye
 * `mapPublicProductVariantTableRow.ts` düzleştirip eski DTO şeklini (`measurements`,
 * `color`, `materials`) korur.
 */
export const productVariantStructureInclude = {
    size: {
        include: {
            values: {
                include: {
                    requirement: {
                        include: {
                            measurementType: {
                                include: {
                                    translations: {
                                        orderBy: { locale: "asc" as const },
                                        select: measurementTypeTranslationSelect,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    version: {
        include: {
            color: {
                include: {
                    translations: {
                        orderBy: { locale: "asc" as const },
                        select: colorTranslationSelect,
                    },
                },
            },
            materials: {
                include: {
                    assets: true,
                    translations: {
                        orderBy: { locale: "asc" as const },
                        select: materialTranslationSelect,
                    },
                },
            },
        },
    },
} satisfies Prisma.ProductVariantInclude

export type ProductVariantWithRelations = Prisma.ProductVariantGetPayload<{
    include: {
        product: true
        size: {
            include: {
                values: {
                    include: {
                        requirement: {
                            include: {
                                measurementType: {
                                    include: {
                                        translations: {
                                            select: typeof measurementTypeTranslationSelect
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        version: {
            include: {
                color: {
                    include: {
                        translations: {
                            select: typeof colorTranslationSelect
                        }
                    }
                }
                materials: {
                    include: {
                        assets: true
                        translations: {
                            select: typeof materialTranslationSelect
                        }
                    }
                }
            }
        }
        variantSuppliers: {
            include: {
                supplier: true
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
    listPublicProductVariants(query: IPaginationQuery): Promise<{
        data: any[]
        meta: { page: number; limit: number; total: number; totalPages: number }
    }>
    getPublicProductVariant(id: string): Promise<any | null>
    listProductVariantsByIds(ids: string[]): Promise<ProductVariantWithRelations[]>
    createProductVariant(data: Prisma.ProductVariantCreateInput): Promise<ProductVariant>
    updateProductVariant(id: string, data: Prisma.ProductVariantUpdateInput): Promise<ProductVariant>
    deleteProductVariant(id: string): Promise<ProductVariant>
    getProductVariantTableData(productId: string, options?: { includeListPrice?: boolean }): Promise<any[]>
}

const defaultInclude = {
    product: true,
    ...productVariantStructureInclude,
    variantSuppliers: {
        include: { supplier: true }
    },
} satisfies Prisma.ProductVariantInclude

/**
 * PUBLIC okuma include'u — `variantSuppliers` KASITLI OLARAK YOK.
 *
 * Public `/product-variants` ve `/product-variants/{id}` uçları uzun süre admin
 * ile aynı `defaultInclude`'u kullanıyordu; bu da tedarikçi adını ve
 * price/netCost/profitRate/listPrice alanlarını public yanıta sızdırıyordu. Kural
 * yalnız `/products/{id}/variant-table` yolunda uygulanmıştı (bkz. P1.8 B0), diğer
 * iki yolda değil.
 */
const publicInclude = {
    product: true,
    ...productVariantStructureInclude,
} satisfies Prisma.ProductVariantInclude

/** Varyant tablosu her yerde ölçü kodu, sonra versiyon sırasıyla gösterilir. */
const variantTableOrderBy = [
    { size: { code: "asc" as const } },
    { version: { code: "asc" as const } },
]

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

    const listPublicProductVariants = async (query: IPaginationQuery) => {
        const { where, orderBy, skip, take, page, limit } = buildPaginationQuery<ProductVariant>(query, {
            searchableFields: ["fullCode", "name"],
            defaultSort: "fullCode",
        })

        const [data, total] = await Promise.all([
            prisma.productVariant.findMany({ where, orderBy, skip, take, include: publicInclude }),
            prisma.productVariant.count({ where }),
        ])

        return buildPaginationResponse(data, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const getPublicProductVariant = async (id: string) =>
        prisma.productVariant.findUnique({ where: { id }, include: publicInclude })

    const listProductVariantsByIds = async (ids: string[]) => {
        const uniqueIds = Array.from(new Set(ids.filter(Boolean)))
        if (uniqueIds.length === 0) return []

        return prisma.productVariant.findMany({
            where: {
                id: { in: uniqueIds },
            },
            include: defaultInclude,
        })
    }

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

    const getProductVariantTableData = async (productId: string, options: { includeListPrice?: boolean } = {}) => {
        return prisma.productVariant.findMany({
            where: { productId },
            orderBy: variantTableOrderBy,
            include: {
                size: {
                    include: {
                        values: {
                            orderBy: [
                                { requirement: { sortPriority: "asc" } },
                                { requirement: { displayOrder: "asc" } },
                            ],
                            include: {
                                requirement: {
                                    include: {
                                        measurementType: {
                                            include: {
                                                translations: {
                                                    orderBy: { locale: "asc" },
                                                    select: measurementTypeTranslationSelect,
                                                },
                                            },
                                        },
                                        translations: {
                                            orderBy: { locale: "asc" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                version: {
                    include: {
                        color: {
                            include: {
                                translations: {
                                    orderBy: { locale: "asc" },
                                    select: colorTranslationSelect,
                                },
                            },
                        },
                        materials: {
                            include: {
                                assets: {
                                    where: {
                                        type: "PDF",
                                        role: "CERTIFICATE",
                                    },
                                    orderBy: {
                                        createdAt: "desc",
                                    },
                                },
                                translations: {
                                    orderBy: { locale: "asc" },
                                    select: materialTranslationSelect,
                                },
                            },
                        },
                    },
                },
                // P1.8(B0): variantSuppliers YALNIZ customer varyant-tablosu için
                // (liste fiyatı overlay'i). Public yanıta HİÇ dahil edilmez —
                // listPrice + tedarikçi kimliği public'e çıkmamalı. Customer'da da
                // yalnız fiyat alanları seçilir (resolveMinListPrice'ın kullandığı):
                // tedarikçi maliyeti (price/netCost/profitRate/...) ve tedarikçi
                // künyesi (id/name/adres/vergiNo) DB'den HİÇ çekilmez.
                ...(options.includeListPrice
                    ? {
                        variantSuppliers: {
                            select: {
                                listPrice: true,
                                currency: true,
                                pricingUpdatedAt: true,
                                updatedAt: true,
                            },
                            orderBy: [{ isActive: "desc" as const }],
                        },
                    }
                    : {}),
            }
        })
    }

    return {
        listProductVariants,
        getProductVariant,
        listPublicProductVariants,
        getPublicProductVariant,
        listProductVariantsByIds,
        createProductVariant,
        updateProductVariant,
        deleteProductVariant,
        getProductVariantTableData,
    }
}

/**
 * Çeviri taşımayan sade yapı include'u — sipariş, business request, kampanya,
 * özel fiyat ve müşteri atama yüzeyleri bunu kullanır. Bu yüzeyler ölçü/renk/hammadde
 * sözlüklerini lokalize etmez, yalnız ham adları gösterir.
 */
export const productVariantStructureIncludeBasic = {
    size: {
        include: {
            values: {
                orderBy: [
                    { requirement: { sortPriority: "asc" as const } },
                    { requirement: { displayOrder: "asc" as const } },
                ],
                include: {
                    requirement: {
                        include: { measurementType: true },
                    },
                },
            },
        },
    },
    version: {
        include: {
            color: true,
            materials: true,
        },
    },
} satisfies Prisma.ProductVariantInclude
