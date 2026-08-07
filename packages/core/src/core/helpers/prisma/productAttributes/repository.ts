import { prisma } from "@/core/db/prisma"
import { Prisma, ProductAttribute } from "@/prisma/generated/prisma/client"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import { buildAssetUrl } from "@/core/helpers/assets/buildAssetUrl"
import { getEffectiveCustomerAssignable } from "@/core/helpers/productAttributes/customerAssignableAttributes"
import {
    DEFAULT_LOCALE,
    getSupportedLocale,
    type SupportedLocale,
} from "@/core/i18n/locales"
import {
    localizeProductAttribute,
    localizeProductAttributeValue,
    type LocalizedProductAttribute,
} from "@/core/helpers/productAttributes/localizeProductAttribute"

/**
 * `translations` ve `alternateSlugs` OPSİYONELDİR — `listAttributesForFilter`
 * `includeTranslations: false` ile çağrıldığında yanıtta hiç bulunmazlar.
 * Bkz. o metodun üstündeki not.
 */
type ProductAttributeForFilter = {
    id: string
    code: string
    name: string
    locale: SupportedLocale
    resolvedLocale: string
    translationMissing: boolean
    translations?: {
        id: string
        locale: string
        name: string
        createdAt: Date
        updatedAt: Date
    }[]
    isCustomerAssignable: boolean
    values: {
        id: string
        name: string
        slug: string
        locale: SupportedLocale
        resolvedLocale: string
        translationMissing: boolean
        alternateSlugs?: Record<string, string>
        translations?: {
            id: string
            locale: string
            name: string
            slug: string
            createdAt: Date
            updatedAt: Date
        }[]
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

export type ListAttributesForFilterOptions = {
    /**
     * Ham çeviri satırları (+ value'ların `alternateSlugs`'ı) yanıta dahil edilsin mi?
     * Varsayılan `true` = mevcut davranış (AdminApi yönetim yüzeyleri buna güveniyor).
     */
    includeTranslations?: boolean
}

const productAttributeInclude = {
    translations: {
        orderBy: { locale: "asc" },
    },
} satisfies Prisma.ProductAttributeInclude

type ProductAttributeWithTranslations = Prisma.ProductAttributeGetPayload<{
    include: typeof productAttributeInclude
}>

export interface IPrismaProductAttributeRepository {
    listProductAttributes(query: IPaginationQuery & { locale?: SupportedLocale }): Promise<{
        data: LocalizedProductAttribute<ProductAttributeWithTranslations>[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    listAttributesWithValues(locale?: SupportedLocale): Promise<any[]>
    listAttributesForFilter(
        locale?: SupportedLocale,
        options?: ListAttributesForFilterOptions,
    ): Promise<ProductAttributeForFilter[]>
    getProductAttribute(id: string, locale?: SupportedLocale): Promise<LocalizedProductAttribute<ProductAttributeWithTranslations>>
    createProductAttribute(data: Prisma.ProductAttributeCreateInput): Promise<LocalizedProductAttribute<ProductAttributeWithTranslations>>
    updateProductAttribute(id: string, data: Prisma.ProductAttributeUpdateInput): Promise<LocalizedProductAttribute<ProductAttributeWithTranslations>>
    deleteProductAttribute(id: string): Promise<ProductAttribute>
}

export const productAttributeRepository = (): IPrismaProductAttributeRepository => {
    const applyEffectiveCustomerAssignable = <T extends { code: string; isCustomerAssignable: boolean }>(attribute: T): T => ({
        ...attribute,
        isCustomerAssignable: getEffectiveCustomerAssignable(attribute),
    })
    const localizeAttribute = <T extends ProductAttribute & { translations?: any[] }>(
        attribute: T,
        locale: SupportedLocale = DEFAULT_LOCALE,
    ) => applyEffectiveCustomerAssignable(localizeProductAttribute(attribute, locale))

    const listProductAttributes = async (query: IPaginationQuery & { locale?: SupportedLocale }) => {
        const locale = getSupportedLocale(query.locale)
        const search = query.search?.trim()
        const searchableLocales = locale === DEFAULT_LOCALE
            ? [DEFAULT_LOCALE]
            : [locale, DEFAULT_LOCALE]

        const {
            orderBy,
            skip,
            take,
            page,
            limit,
        } = buildPaginationQuery<ProductAttribute>(query, {
            searchableFields: ["name"],
            defaultSort: "createdAt",
        })
        const where: Prisma.ProductAttributeWhereInput = search
            ? {
                OR: [
                    {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    {
                        translations: {
                            some: {
                                locale: { in: searchableLocales },
                                name: {
                                    contains: search,
                                    mode: "insensitive",
                                },
                            },
                        },
                    },
                    {
                        code: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                ],
            }
            : {}

        const [data, total] = await Promise.all([
            prisma.productAttribute.findMany({
                where,
                orderBy,
                skip,
                take,
                include: productAttributeInclude,
            }),
            prisma.productAttribute.count({ where }),
        ])

        return buildPaginationResponse(data.map((attribute) => localizeAttribute(attribute, locale)), {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        })
    }

    const listAttributesWithValues = async (requestedLocale?: SupportedLocale) => {
        const locale = getSupportedLocale(requestedLocale)
        const attributes = await prisma.productAttribute.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                displayOrder: "asc",
            },
            include: {
                ...productAttributeInclude,
                values: {
                    where: {
                        isActive: true,
                    },
                    orderBy: {
                        displayOrder: "asc",
                    },
                    include: {
                        translations: {
                            orderBy: { locale: "asc" },
                        },
                    },
                },
            },
        })

        return attributes.map((attribute) => localizeAttribute({
            ...attribute,
            values: attribute.values.map((value) => localizeProductAttributeValue(value, locale)),
        }, locale))
    }

    /**
     * PERFORMANS NOTU (2026-08-07, ölçülerek eklendi): Bu metodun tam yanıtı
     * `locale=tr` için **4.45 MB**'tı ve bunun **%71.6'sı ham `translations`**,
     * %10.6'sı `alternateSlugs` idi — hâlbuki lokalizasyon zaten sunucuda yapılıp
     * `name`/`slug`/`resolvedLocale` alanlarına yazılıyor. Public tarafta bu iki
     * alanı okuyan hiçbir tüketici yok; buna karşılık boyut, Next'in 2 MB
     * data-cache tavanını aştığı için public layout'un `unstable_cache`'i HİÇ
     * yazılamıyordu (her sayfa, her dil, her render'da 4.45 MB taze fetch).
     *
     * `includeTranslations: false` ile:
     *   - çeviri satırları DB'de de yalnız istenen dil + varsayılan dile daraltılır
     *     (lokalizasyon için gereken tek şey bu ikisidir — bkz. localizeProductAttribute),
     *   - lokalizasyondan SONRA `translations` ve `alternateSlugs` yanıttan çıkarılır.
     * Ölçülen: ~4.45 MB → ~0.8 MB.
     *
     * Varsayılan `true`'dur: AdminApi `GET /product-attributes/with-values` aynı
     * metodu kullanıyor ve attribute yönetim ekranları ham çevirileri düzenliyor.
     */
    const listAttributesForFilter = async (
        requestedLocale?: SupportedLocale,
        options?: ListAttributesForFilterOptions,
    ) => {
        const locale = getSupportedLocale(requestedLocale)
        const includeTranslations = options?.includeTranslations ?? true
        // Lokalizasyon yalnız istenen dil + DEFAULT_LOCALE satırlarına bakar.
        const translationsWhere = includeTranslations
            ? undefined
            : { locale: { in: [...new Set([locale, DEFAULT_LOCALE])] } }
        const attributes = await prisma.productAttribute.findMany({
            where: { isActive: true },
            select: {
                id: true,
                code: true,
                name: true,
                displayOrder: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                translations: {
                    where: translationsWhere,
                    orderBy: { locale: "asc" },
                    select: {
                        id: true,
                        locale: true,
                        name: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                isCustomerAssignable: true,
                values: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        attributeId: true,
                        displayOrder: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true,
                        translations: {
                            where: translationsWhere,
                            orderBy: { locale: "asc" },
                            select: {
                                id: true,
                                locale: true,
                                name: true,
                                slug: true,
                                createdAt: true,
                                updatedAt: true,
                            },
                        },
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

        return attributes.map((attribute) => {
            // Lokalizasyon çevirileri OKUR; aşağıda yalnız yanıttan çıkarılırlar.
            const { translations: attributeTranslations, ...localizedAttribute } =
                localizeAttribute(attribute, locale)

            return {
                ...localizedAttribute,
                ...(includeTranslations ? { translations: attributeTranslations } : {}),
                isCustomerAssignable: getEffectiveCustomerAssignable(attribute),
                values: attribute.values.map((value) => {
                    const {
                        translations: valueTranslations,
                        alternateSlugs,
                        ...localizedValue
                    } = localizeProductAttributeValue(value, locale)

                    return {
                        ...localizedValue,
                        ...(includeTranslations
                            ? { translations: valueTranslations, alternateSlugs }
                            : {}),
                        assets: value.assets.map((asset) => ({
                            ...asset,
                            url: buildAssetUrl(asset.key),
                        })),
                    }
                }),
            }
        })
    }

    const getProductAttribute = async (
        id: string,
        requestedLocale?: SupportedLocale,
    ) => {
        const locale = getSupportedLocale(requestedLocale)
        const attribute = await prisma.productAttribute.findUniqueOrThrow({
            where: { id },
            include: productAttributeInclude,
        })
        return localizeAttribute(attribute, locale)
    }

    const createProductAttribute = async (data: Prisma.ProductAttributeCreateInput) => {
        const attribute = await prisma.productAttribute.create({
            data,
            include: productAttributeInclude,
        })
        return localizeAttribute(attribute)
    }

    const updateProductAttribute = async (id: string, data: Prisma.ProductAttributeUpdateInput) => {
        const attribute = await prisma.productAttribute.update({
            where: { id },
            data,
            include: productAttributeInclude,
        })
        return localizeAttribute(attribute)
    }

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
