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

// Public / liste okumaları yalnız doğrulanmış asset'leri görür. Presign akışında
// oluşan PENDING_UPLOAD satırları S3 ObjectCreated onayına kadar gizlenir
// (confirmCategoryAssetUpload). Yalnız admin kategori yönetim dialog'u
// (getCategory / updateCategory, includeAllAssets: true) PENDING'i rozetle gösterir.
const categoryInclude = {
    assets: {
        where: { uploadStatus: "ACTIVE" },
    },
    translations: {
        orderBy: { locale: "asc" },
    },
} satisfies Prisma.CategoryInclude

// Payload ŞEKLİ aynı (assets: Asset[]); yalnız `where` filtresi düşüyor. Tüm
// sorgu yerlerinin tek `CategoryWithRelations` tipine çözülmesi için `categoryInclude`
// tipine daraltılır — union bir include Prisma'nın GetPayload çıkarımını bozuyor.
const categoryIncludeAllAssets = {
    ...categoryInclude,
    assets: true,
} as unknown as typeof categoryInclude

const pickCategoryInclude = (includeAllAssets = false) =>
    includeAllAssets ? categoryIncludeAllAssets : categoryInclude

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
    getCategory(id: string, locale?: SupportedLocale, opts?: { includeAllAssets?: boolean }): Promise<LocalizedCategory<CategoryWithRelations>>
    getCategoryBySlug(slug: string, locale?: SupportedLocale): Promise<LocalizedCategory<CategoryWithRelations>>
    createCategory(data: Prisma.CategoryCreateInput): Promise<LocalizedCategory<CategoryWithRelations>>
    updateCategory(id: string, data: Prisma.CategoryUpdateInput, opts?: { includeAllAssets?: boolean }): Promise<LocalizedCategory<CategoryWithRelations>>
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
                include: pickCategoryInclude(),
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
        opts?: { includeAllAssets?: boolean },
    ) => {
        const category = await prisma.category.findUniqueOrThrow({
            where: { id },
            include: pickCategoryInclude(opts?.includeAllAssets),
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
                        include: pickCategoryInclude(),
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

        // Slug BAŞKA bir dilin çevirisine ait olabilir: dil değiştirici mevcut
        // slug'ı koruduğunda /fr/urun-kategori/<de-slug> gibi adresler oluşuyor.
        // Ürün tarafındaki `getProductBySlug` ile simetrik — orada eksikken
        // /urun/<en-slug> 404 veriyordu. Kategori de burada bulunur ve sayfa bu
        // locale'in kanonik slug'ına yönlendirir, böylece aynı içerik iki URL'de
        // yayınlanmaz.
        const anyLocaleTranslation = await prisma.categoryTranslation.findFirst({
            where: { slug },
            include: {
                category: {
                    include: pickCategoryInclude(),
                },
            },
        })
        if (anyLocaleTranslation) {
            return localizeCategory(anyLocaleTranslation.category, locale)
        }

        const legacyCategory = await prisma.category.findUniqueOrThrow({
            where: { slug },
            include: pickCategoryInclude(),
        })

        return localizeCategory(legacyCategory, locale)
    }

    const createCategory = async (data: Prisma.CategoryCreateInput) => {
        const category = await prisma.category.create({
            data,
            include: pickCategoryInclude(),
        })

        return localizeCategory(category, DEFAULT_LOCALE)
    }

    const updateCategory = async (
        id: string,
        data: Prisma.CategoryUpdateInput,
        opts?: { includeAllAssets?: boolean },
    ) => {
        const category = await prisma.category.update({
            where: { id },
            data,
            include: pickCategoryInclude(opts?.includeAllAssets),
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
