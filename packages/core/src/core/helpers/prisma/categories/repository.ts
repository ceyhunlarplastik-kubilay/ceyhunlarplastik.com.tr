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
import { categoryAuditLabel, toCategoryAuditSnapshot } from "@/core/helpers/categories/categoryAudit"
import { diffAuditSnapshots } from "@/core/helpers/audit/auditDiff"
import { writeAuditLog } from "@/core/helpers/audit/writeAuditLog"
import { Prisma } from "@/prisma/generated/prisma/client"

import type { AuditContext, AuditMetadata } from "@/core/helpers/audit/types"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import type { Category } from "@/prisma/generated/prisma/client"

const CATEGORY_MAX_LIMIT = 500

// Client `$extends`'li olduğu için `Prisma.TransactionClient` uymuyor.
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

// Denetimli yazmalar interaktif transaction ister: önceki hâl okunur, değişiklik yapılır,
// fark AYNI transaction'da yazılır. Varsayılan 5 sn Neon'da dar kalabiliyor.
const categoryWriteTransactionOptions = { timeout: 15_000, maxWait: 10_000 } as const

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

/**
 * Önceki hâli okumadan ÖNCE satırı kilitler. Kilitsiz okumada eşzamanlı iki güncellemenin
 * ikincisi, birincinin commit'inden önceki hâli "önce" diye kaydederdi — denetim kaydı
 * gerçek sırayı yansıtmazdı.
 */
const lockCategoryRow = (tx: TransactionClient, id: string) =>
    tx.$queryRaw`SELECT "id" FROM "Category" WHERE "id" = ${id} FOR UPDATE`

/**
 * Kategoriyi oluşturur ve denetim kaydını AYNI transaction'da yazar.
 *
 * Zaten bir transaction içinde olan çağıranlar (iş talebi onayı) için dışa açık; diğer
 * her yer `categoryRepository().createCategory` kullanır. Kategoriye yazan başka bir yol
 * AÇMA: `auditCoverage.test.ts` bu dosya dışındaki doğrudan yazmayı yakalar.
 */
export async function createCategoryInTransaction(
    tx: TransactionClient,
    data: Prisma.CategoryCreateInput,
    audit: AuditContext,
    metadata?: AuditMetadata,
) {
    const category = await tx.category.create({
        data,
        include: pickCategoryInclude(),
    })

    await writeAuditLog(tx, {
        entityType: "Category",
        entityId: category.id,
        entityLabel: categoryAuditLabel(category),
        action: "CREATE",
        changes: diffAuditSnapshots(null, toCategoryAuditSnapshot(category)),
        metadata,
        context: audit,
    })

    return category
}

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
    // Yazan her metod `audit`'i ZORUNLU alır: denetim kaydı değişiklikle aynı transaction'da yazılır.
    createCategory(data: Prisma.CategoryCreateInput, audit: AuditContext): Promise<LocalizedCategory<CategoryWithRelations>>
    updateCategory(id: string, data: Prisma.CategoryUpdateInput, audit: AuditContext, opts?: { includeAllAssets?: boolean }): Promise<LocalizedCategory<CategoryWithRelations>>
    deleteCategory(id: string, audit: AuditContext): Promise<Category>
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

    const createCategory = async (data: Prisma.CategoryCreateInput, audit: AuditContext) => {
        const category = await prisma.$transaction(
            (tx) => createCategoryInTransaction(tx, data, audit),
            categoryWriteTransactionOptions,
        )

        return localizeCategory(category, DEFAULT_LOCALE)
    }

    const updateCategory = async (
        id: string,
        data: Prisma.CategoryUpdateInput,
        audit: AuditContext,
        opts?: { includeAllAssets?: boolean },
    ) => {
        const category = await prisma.$transaction(async (tx) => {
            await lockCategoryRow(tx, id)

            const before = await tx.category.findUniqueOrThrow({
                where: { id },
                include: { translations: true },
            })
            const updated = await tx.category.update({
                where: { id },
                data,
                include: pickCategoryInclude(opts?.includeAllAssets),
            })

            // Fark, ham satırlardan alınır (`localizeCategory` ad/slug'ı çeviriyle ezer).
            const changes = diffAuditSnapshots(
                toCategoryAuditSnapshot(before),
                toCategoryAuditSnapshot(updated),
            )

            // Denetlenen hiçbir alan değişmediyse (aynı değerle kaydetme, yalnız görsel
            // ekleme) kayıt yazılmaz: boş kayıt geçmişi kirletir.
            if (changes.length > 0) {
                await writeAuditLog(tx, {
                    entityType: "Category",
                    entityId: id,
                    entityLabel: categoryAuditLabel(updated),
                    action: "UPDATE",
                    changes,
                    context: audit,
                })
            }

            return updated
        }, categoryWriteTransactionOptions)

        return localizeCategory(category, DEFAULT_LOCALE)
    }

    const deleteCategory = (id: string, audit: AuditContext) =>
        prisma.$transaction(async (tx) => {
            await lockCategoryRow(tx, id)

            const before = await tx.category.findUniqueOrThrow({
                where: { id },
                include: {
                    translations: true,
                    assets: { select: { key: true } },
                    _count: { select: { products: true } },
                },
            })
            const category = await tx.category.delete({ where: { id } })

            await writeAuditLog(tx, {
                entityType: "Category",
                entityId: id,
                entityLabel: categoryAuditLabel(before),
                action: "DELETE",
                changes: diffAuditSnapshots(toCategoryAuditSnapshot(before), null),
                // Silme kaskad çalışır (ürünler, çeviriler, görseller): bu satır, gidenlerin
                // kaydının kaldığı TEK yerdir.
                metadata: {
                    cascade: {
                        productCount: before._count.products,
                        assetKeys: before.assets.map((asset) => asset.key),
                    },
                },
                context: audit,
            })

            return category
        }, categoryWriteTransactionOptions)

    return {
        listCategories,
        getCategory,
        getCategoryBySlug,
        createCategory,
        updateCategory,
        deleteCategory,
    }
}
