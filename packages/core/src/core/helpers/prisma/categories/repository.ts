import { prisma } from "@/core/db/prisma"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import {
    DEFAULT_LOCALE,
    getSupportedLocale,
    type SupportedLocale,
} from "@/core/i18n/locales"
import {
    localizeCategory,
    type LocalizedCategory,
} from "@/core/helpers/categories/localizeCategory"
import { Prisma } from "@/prisma/generated/prisma/client"

import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import type { Category } from "@/prisma/generated/prisma/client"

const CATEGORY_MAX_LIMIT = 500

const categoryInclude = {
    assets: true,
    translations: {
        orderBy: { locale: "asc" },
    },
} satisfies Prisma.CategoryInclude

type CategoryWithRelations = Prisma.CategoryGetPayload<{ include: typeof categoryInclude }>

export interface IPrismaCategoryRepository {
    listCategories(query: IPaginationQuery & { locale?: SupportedLocale }): Promise<{
        data: LocalizedCategory<CategoryWithRelations>[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }>
    getCategory(id: string, locale?: SupportedLocale): Promise<LocalizedCategory<CategoryWithRelations>>
    getCategoryBySlug(slug: string, locale?: SupportedLocale): Promise<LocalizedCategory<CategoryWithRelations>>
    createCategory(data: Prisma.CategoryCreateInput): Promise<LocalizedCategory<CategoryWithRelations>>
    updateCategory(id: string, data: Prisma.CategoryUpdateInput): Promise<LocalizedCategory<CategoryWithRelations>>
    deleteCategory(id: string): Promise<Category>
}

export const categoryRepository = (): IPrismaCategoryRepository => {
    const listCategories = async (
        query: IPaginationQuery & { locale?: SupportedLocale },
    ) => {
        const locale = getSupportedLocale(query.locale)
        const page = query.page && query.page > 0 ? query.page : 1
        const limit = query.limit && query.limit > 0
            ? Math.min(query.limit, CATEGORY_MAX_LIMIT)
            : 20
        const skip = (page - 1) * limit
        const order = query.order === "desc" ? "desc" : "asc"
        const search = query.search?.trim()
        const searchableLocales = locale === DEFAULT_LOCALE
            ? [DEFAULT_LOCALE]
            : [locale, DEFAULT_LOCALE]

        const where: Prisma.CategoryWhereInput = search
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
                    ...(/^\d+$/.test(search)
                        ? [{ code: Number.parseInt(search, 10) }]
                        : []),
                ],
            }
            : {}

        const sort = query.sort === "name" || query.sort === "createdAt"
            ? query.sort
            : "code"
        const orderBy: Prisma.CategoryOrderByWithRelationInput = {
            [sort]: order,
        }

        const [categories, total] = await Promise.all([
            prisma.category.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                include: categoryInclude,
            }),
            prisma.category.count({ where }),
        ])

        return buildPaginationResponse(
            categories.map((category) => localizeCategory(category, locale)),
            {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        )
    }

    const getCategory = async (
        id: string,
        locale: SupportedLocale = DEFAULT_LOCALE,
    ) => {
        const category = await prisma.category.findUniqueOrThrow({
            where: { id },
            include: categoryInclude,
        })

        return localizeCategory(category, locale)
    }

    const getCategoryBySlug = async (
        slug: string,
        locale: SupportedLocale = DEFAULT_LOCALE,
    ) => {
        const findTranslation = (translationLocale: SupportedLocale) =>
            prisma.categoryTranslation.findUnique({
                where: {
                    locale_slug: {
                        locale: translationLocale,
                        slug,
                    },
                },
                include: {
                    category: {
                        include: categoryInclude,
                    },
                },
            })

        const exactTranslation = await findTranslation(locale)
        if (exactTranslation) {
            return localizeCategory(exactTranslation.category, locale)
        }

        if (locale !== DEFAULT_LOCALE) {
            const fallbackTranslation = await findTranslation(DEFAULT_LOCALE)
            if (fallbackTranslation) {
                return localizeCategory(fallbackTranslation.category, locale)
            }
        }

        const legacyCategory = await prisma.category.findUniqueOrThrow({
            where: { slug },
            include: categoryInclude,
        })

        return localizeCategory(legacyCategory, locale)
    }

    const createCategory = async (data: Prisma.CategoryCreateInput) => {
        const category = await prisma.category.create({
            data,
            include: categoryInclude,
        })

        return localizeCategory(category, DEFAULT_LOCALE)
    }

    const updateCategory = async (
        id: string,
        data: Prisma.CategoryUpdateInput,
    ) => {
        const category = await prisma.category.update({
            where: { id },
            data,
            include: categoryInclude,
        })

        return localizeCategory(category, DEFAULT_LOCALE)
    }

    const deleteCategory = (id: string) =>
        prisma.category.delete({ where: { id } })

    return {
        listCategories,
        getCategory,
        getCategoryBySlug,
        createCategory,
        updateCategory,
        deleteCategory,
    }
}
