import { prisma } from "@/core/db/prisma"
import { Prisma, ProductAttributeValue } from "@/prisma/generated/prisma/client"
import {
    DEFAULT_LOCALE,
    getSupportedLocale,
    type SupportedLocale,
} from "@/core/i18n/locales"
import {
    localizeProductAttribute,
    localizeProductAttributeValue,
} from "@/core/helpers/productAttributes/localizeProductAttribute"

export type ProductAttributeValueWithParent = Prisma.ProductAttributeValueGetPayload<{
    include: {
        parentValue: {
            include: {
                translations: true
            }
        }
        assets: true
        translations: true
    }
}>

export type ProductAttributeValueWithAttribute = Prisma.ProductAttributeValueGetPayload<{
    include: {
        attribute: {
            include: {
                translations: true
            }
        }
        parentValue: {
            include: {
                translations: true
                attribute: {
                    include: {
                        translations: true
                    }
                }
                parentValue: {
                    include: {
                        translations: true
                        attribute: {
                            include: {
                                translations: true
                            }
                        }
                    }
                }
            }
        }
        assets: true
        translations: true
    }
}>

export type ProductAttributeValueDeleteBlockers = {
    childValues: number
    products: number
    categories: number
    customers: number
    customerAttributeAssignments: number
    productIndustrialUsages: number
}

/**
 * Doğrulama için gereken minimum alanlar. `getValueById`'nin derin include'u
 * (çeviriler + 3 seviye parent + assets) bu iş için gereksiz; attribute value
 * seçimi doğrulanırken yalnız aktiflik, attribute kodu ve parent zinciri okunur.
 */
export type ProductAttributeValueValidationRow = {
    id: string
    isActive: boolean
    parentValueId: string | null
    attribute: { id: string; code: string; isActive: boolean }
    parentValue: {
        id: string
        parentValueId: string | null
        parentValue: { id: string; parentValueId: string | null } | null
    } | null
}

export interface IPrismaProductAttributeValueRepository {
    listValues(attributeId: string, locale?: SupportedLocale): Promise<any[]>
    getValueById(id: string, locale?: SupportedLocale): Promise<any | null>
    /**
     * Birden çok ID'yi TEK sorguda, doğrulamaya yeten slim şekilde çeker.
     * Eskiden çağıranlar ID başına `getValueById` çağırıyordu; endüstriyel
     * kullanım satırı başına 3 sorgu demekti (100 satır → 300 ardışık sorgu).
     */
    getValuesForValidation(ids: string[]): Promise<ProductAttributeValueValidationRow[]>
    getDeleteBlockers(id: string): Promise<ProductAttributeValueDeleteBlockers>
    createValue(data: Prisma.ProductAttributeValueCreateInput): Promise<any>
    updateValue(id: string, data: Prisma.ProductAttributeValueUpdateInput): Promise<any>
    deleteValue(id: string): Promise<ProductAttributeValue>
}

export const productAttributeValueRepository = (): IPrismaProductAttributeValueRepository => {
    const localizeValue = <T extends ProductAttributeValue & { translations?: any[] }>(
        value: T,
        locale: SupportedLocale = DEFAULT_LOCALE,
    ) => {
        const localized = localizeProductAttributeValue(value, locale)
        const valueWithRelations = value as T & {
            parentValue?: (ProductAttributeValue & { translations?: any[] }) | null
            attribute?: Parameters<typeof localizeProductAttribute>[0] | null
        }

        return {
            ...localized,
            ...(valueWithRelations.parentValue && {
                parentValue: localizeProductAttributeValue(valueWithRelations.parentValue, locale),
            }),
            ...(valueWithRelations.attribute && {
                attribute: localizeProductAttribute(valueWithRelations.attribute, locale),
            }),
        }
    }

    const listValues = async (
        attributeId: string,
        requestedLocale?: SupportedLocale,
    ) => {
        const locale = getSupportedLocale(requestedLocale)
        const values = await prisma.productAttributeValue.findMany({
            where: {
                attributeId,
                isActive: true
            },
            orderBy: {
                displayOrder: "asc"
            },
            include: {
                translations: {
                    orderBy: { locale: "asc" },
                },
                parentValue: {
                    include: {
                        translations: {
                            orderBy: { locale: "asc" },
                        },
                    },
                },
                assets: true,
            },
        })

        return values.map((value) => localizeValue(value, locale))
    }

    const getValueById = async (
        id: string,
        requestedLocale?: SupportedLocale,
    ) => {
        const locale = getSupportedLocale(requestedLocale)
        const value = await prisma.productAttributeValue.findUnique({
            where: { id },
            include: {
                translations: {
                    orderBy: { locale: "asc" },
                },
                attribute: {
                    include: {
                        translations: {
                            orderBy: { locale: "asc" },
                        },
                    },
                },
                parentValue: {
                    include: {
                        translations: {
                            orderBy: { locale: "asc" },
                        },
                        attribute: {
                            include: {
                                translations: {
                                    orderBy: { locale: "asc" },
                                },
                            },
                        },
                        parentValue: {
                            include: {
                                translations: {
                                    orderBy: { locale: "asc" },
                                },
                                attribute: {
                                    include: {
                                        translations: {
                                            orderBy: { locale: "asc" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                assets: true,
            },
        })

        return value ? localizeValue(value, locale) : null
    }

    const getValuesForValidation = async (
        ids: string[],
    ): Promise<ProductAttributeValueValidationRow[]> => {
        if (ids.length === 0) return []

        return prisma.productAttributeValue.findMany({
            where: { id: { in: ids } },
            select: {
                id: true,
                isActive: true,
                parentValueId: true,
                attribute: { select: { id: true, code: true, isActive: true } },
                parentValue: {
                    select: {
                        id: true,
                        parentValueId: true,
                        parentValue: { select: { id: true, parentValueId: true } },
                    },
                },
            },
        })
    }

    const getDeleteBlockers = async (id: string): Promise<ProductAttributeValueDeleteBlockers> => {
        const [
            childValues,
            products,
            categories,
            customers,
            customerAttributeAssignments,
            productIndustrialUsages,
        ] = await Promise.all([
            prisma.productAttributeValue.count({
                where: { parentValueId: id },
            }),
            prisma.product.count({
                where: {
                    attributeValues: {
                        some: { id },
                    },
                },
            }),
            prisma.category.count({
                where: {
                    allowedAttributeValueIds: {
                        has: id,
                    },
                },
            }),
            prisma.customer.count({
                where: {
                    OR: [
                        { sectorValueId: id },
                        { productionGroupValueId: id },
                        {
                            usageAreaValues: {
                                some: { id },
                            },
                        },
                    ],
                },
            }),
            prisma.customerAttributeValueAssignment.count({
                where: { attributeValueId: id },
            }),
            prisma.productIndustrialUsage.count({
                where: {
                    OR: [
                        { sectorValueId: id },
                        { productionGroupValueId: id },
                        { usageAreaValueId: id },
                    ],
                },
            }),
        ])

        return {
            childValues,
            products,
            categories,
            customers,
            customerAttributeAssignments,
            productIndustrialUsages,
        }
    }

    const createValue = async (data: Prisma.ProductAttributeValueCreateInput) => {
        const value = await prisma.productAttributeValue.create({
            data,
            include: {
                translations: {
                    orderBy: { locale: "asc" },
                },
                assets: true,
                parentValue: {
                    include: {
                        translations: {
                            orderBy: { locale: "asc" },
                        },
                    },
                },
            },
        })
        return localizeValue(value)
    }

    const updateValue = async (id: string, data: Prisma.ProductAttributeValueUpdateInput) => {
        const value = await prisma.productAttributeValue.update({
            where: { id },
            data,
            include: {
                translations: {
                    orderBy: { locale: "asc" },
                },
                assets: true,
                parentValue: {
                    include: {
                        translations: {
                            orderBy: { locale: "asc" },
                        },
                    },
                },
            },
        })
        return localizeValue(value)
    }

    const deleteValue = (id: string) =>
        prisma.productAttributeValue.delete({
            where: { id }
        })

    return {
        listValues,
        getValueById,
        getValuesForValidation,
        getDeleteBlockers,
        createValue,
        updateValue,
        deleteValue
    }
}
