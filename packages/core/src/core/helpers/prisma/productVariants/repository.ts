import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import { buildFilterQuery } from "@/core/helpers/filters/buildFilterQuery"

import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import { Prisma, ProductVariant } from "@/prisma/generated/prisma/client"
import { colorTranslationSelect } from "@/core/helpers/prisma/colors/repository"
import { materialTranslationSelect } from "@/core/helpers/prisma/materials/repository"
import { measurementTypeTranslationSelect } from "@/core/helpers/prisma/measurementTypes/repository"
import { DEFAULT_LOCALE, type SupportedLocale } from "@/core/i18n/locales"
import { resolveSizeIdByMeasurementKey } from "@/core/helpers/products/resolveSizeByMeasurementKey"

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
    /** Ölçüye göre sayfalanmış tablo — bir sayfadaki ÖLÇÜLERİN varyantları. */
    getProductVariantTableData(
        productId: string,
        options?: VariantTableQueryOptions,
    ): Promise<{ rows: any[]; total: number; columns: string[] }>
    /** Tek bir ölçünün varyantları (`?m=` ile seçilen). Ölçü yoksa `rows: []`. */
    getProductVariantsByMeasurementKey(
        productId: string,
        options: VariantTableQueryOptions & { measurementKey: string },
    ): Promise<{ rows: any[]; columns: string[] }>
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
export type VariantTableQueryOptions = {
    includeListPrice?: boolean
    /** Çeviriler bu dile + varsayılana daraltılır (bkz. translationLocaleFilter). */
    locale?: SupportedLocale
    page?: number
    limit?: number
    /** `fullCode` içinde arar. */
    search?: string
    order?: "asc" | "desc"
}

/**
 * Prisma 7'de `Prisma.validator` yok. Bu kimlik fonksiyonu include'u tip
 * KISITINDAN geçirirken edebî (literal) çıkarımı korur — açık dönüş-tipi
 * bildirimi ise özyinelemeli Prisma tiplerinde "excessive stack depth" veriyor.
 */
const asVariantInclude = <T extends Prisma.ProductVariantInclude>(include: T) => include

/**
 * Ayrı değişkende tutulur: iki farklı anahtarlı nesne edebi bir dizi içinde
 * birleşim tipi üretiyor (`{a} | {b, a?: undefined}`) ve Prisma'nın `Exact<>`
 * kısıtı fazladan `?: undefined` alanları reddediyor.
 */
const sizeValueOrderBy: Prisma.ProductSizeValueOrderByWithRelationInput[] = [
    { requirement: { sortPriority: "asc" } },
    { requirement: { displayOrder: "asc" } },
]

/** Ölçü kimliğini çözmek için gereken minimum alanlar. */
const sizeKeySelect = {
    id: true,
    values: {
        select: {
            value: true,
            requirement: { select: { measurementType: { select: { id: true, displayOrder: true } } } },
        },
    },
} as const

/**
 * `order` YALNIZ satır (ölçü) sırasını çevirir. Versiyon kodu HER ZAMAN artan:
 * satır içindeki versiyonlar kullanıcıya V1, V2, V3… diye görünmeli — ters
 * çevirmek kodların okunuşunu bozardı (testle yakalandı).
 */
const buildVariantTableOrderBy = (order: "asc" | "desc") => [
    { size: { code: order } },
    { version: { code: "asc" as const } },
]

/**
 * Çeviri satırlarını isteğin diline + varsayılana daraltır.
 *
 * 14 dil destekleniyor ve bu sorgu her ölçü/renk/hammadde için HEPSİNİ çekiyordu;
 * DTO sonra tek dili seçip gerisini atıyordu. Tek dile daraltmak fallback'i bozar
 * (`localizeNamedDictionaryEntity` isteneni bulamazsa DEFAULT_LOCALE'e düşer), bu
 * yüzden iki dil çekilir: 14 → 2.
 */
const translationLocaleFilter = (locale: SupportedLocale) => ({
    locale: { in: locale === DEFAULT_LOCALE ? [DEFAULT_LOCALE] : [locale, DEFAULT_LOCALE] },
})

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

    /**
     * Public + müşteri varyant tablosunun okuma yolu.
     *
     * Arama, sıralama ve SAYFALAMA SQL'de yapılır. Eskiden bir ürünün TÜM
     * varyantları belleğe çekilip orada sayfalanıyordu; bu, varyant sayısı
     * büyüdükçe Lambda bellek/süresini doğrusal büyütüyordu (P1.8(d)).
     *
     * `columns` sayfadaki satırlardan DEĞİL, ürün modelinin ölçü ŞABLONUNDAN
     * türetilir: kolon listesi sayfadan sayfaya değişmemeli (eski davranışta
     * 2. sayfada farklı kolonlar çıkabiliyordu) ve şablon zaten tek doğru kaynak.
     */
    /** Ürünün ölçü şablonundan kolon kodları — sayfadan bağımsız, tek doğru kaynak. */
    const loadVariantTableColumns = async (productId: string) => {
        const requirements = await prisma.productMeasurementRequirement.findMany({
            where: { productId },
            orderBy: [{ sortPriority: "asc" }, { displayOrder: "asc" }],
            select: { measurementType: { select: { code: true } } },
        })
        return [...new Set(requirements.map((requirement) => requirement.measurementType.code))]
    }

    /**
     * Varyantın YAPISAL include'u (ölçü + versiyon), çevirileri locale'e daraltılmış.
     *
     * Tedarikçi fiyatı BİLİNÇLİ olarak burada değil: koşullu yayılım
     * (`...(x ? {…} : {})`) Prisma'nın `Exact<>` kısıtını genişletiyor ve include
     * reddediliyor. Çağıran taraf iki somut nesne edebinden birini kurar.
     */
    const buildVariantStructureInclude = (
        localeFilter: ReturnType<typeof translationLocaleFilter>,
    ) => asVariantInclude({
                    size: {
                        include: {
                            values: {
                                orderBy: sizeValueOrderBy,
                                include: {
                                    requirement: {
                                        include: {
                                            measurementType: {
                                                include: {
                                                    translations: {
                                                        where: localeFilter,
                                                        orderBy: { locale: "asc" },
                                                        select: measurementTypeTranslationSelect,
                                                    },
                                                },
                                            },
                                            translations: {
                                                where: localeFilter,
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
                                        where: localeFilter,
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
                                        where: localeFilter,
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
    })

    // P1.8(B0): YALNIZ portal (giriş yapmış) tarafında. Tedarikçi kimliği ve
    // maliyeti (price/netCost/profitRate/…) DB'den HİÇ çekilmez.
    const variantSupplierPriceSelect = {
        select: {
            listPrice: true,
            currency: true,
            pricingUpdatedAt: true,
            updatedAt: true,
        },
        orderBy: [{ isActive: "desc" as const }],
    }

    /**
     * Tablo SAYFASI: önce ÖLÇÜLER sayfalanır, sonra o ölçülerin varyantları
     * getirilir. Sayfalamanın doğru birimi ölçüdür — ekranın satırı odur
     * (bkz. groupVariantTableRows). Eskiden ham varyantlar sayfalanıyordu, yani
     * 500 sınırı ekranda kaç satır göreceğinizle ilgisiz bir yerde kesiyordu.
     */
    const getProductVariantTableData = async (
        productId: string,
        options: VariantTableQueryOptions = {},
    ) => {
        const locale = options.locale ?? DEFAULT_LOCALE
        const order = options.order === "desc" ? "desc" as const : "asc" as const
        const page = options.page && options.page > 0 ? options.page : 1
        const limit = options.limit && options.limit > 0 ? options.limit : 100
        const localeFilter = translationLocaleFilter(locale)

        // Arama ölçünün varyant KODLARINDA yapılır; eşleşen ölçü satır olarak kalır.
        const sizeWhere: Prisma.ProductSizeWhereInput = {
            productId,
            ...(options.search
                ? { variants: { some: { fullCode: { contains: options.search, mode: "insensitive" as const } } } }
                : {}),
        }

        const [sizePage, total, columns] = await Promise.all([
            prisma.productSize.findMany({
                where: sizeWhere,
                orderBy: { code: order },
                skip: (page - 1) * limit,
                take: limit,
                select: { id: true },
            }),
            prisma.productSize.count({ where: sizeWhere }),
            loadVariantTableColumns(productId),
        ])

        if (sizePage.length === 0) return { rows: [], total, columns }

        const structure = buildVariantStructureInclude(localeFilter)
        const variantWhere = { productId, productSizeId: { in: sizePage.map((size) => size.id) } }
        const variantOrderBy = buildVariantTableOrderBy(order)

        const rows = options.includeListPrice
            ? await prisma.productVariant.findMany({
                where: variantWhere,
                orderBy: variantOrderBy,
                include: { ...structure, variantSuppliers: variantSupplierPriceSelect },
            })
            : await prisma.productVariant.findMany({
                where: variantWhere,
                orderBy: variantOrderBy,
                include: structure,
            })

        return { rows, total, columns }
    }

    /**
     * Tek ölçünün varyantları — `?m=` ile seçilen ölçü detayı.
     *
     * Eskiden sayfa 500 varyantı çekip İSTEMCİDE tek ölçüye filtreliyordu;
     * ihtiyacının onlarca katını taşıyordu. Anahtar → ölçü çözümü ölçü tablosu
     * üzerinde yapılır (ürün başına onlarca kayıt), varyantlar üzerinde değil.
     */
    const getProductVariantsByMeasurementKey = async (
        productId: string,
        options: VariantTableQueryOptions & { measurementKey: string },
    ) => {
        const locale = options.locale ?? DEFAULT_LOCALE
        const localeFilter = translationLocaleFilter(locale)

        const [sizes, columns] = await Promise.all([
            prisma.productSize.findMany({ where: { productId }, select: sizeKeySelect }),
            loadVariantTableColumns(productId),
        ])

        const sizeId = resolveSizeIdByMeasurementKey(sizes, options.measurementKey)
        if (!sizeId) return { rows: [], columns }

        const structure = buildVariantStructureInclude(localeFilter)
        const variantWhere = { productId, productSizeId: sizeId }
        const variantOrderBy = buildVariantTableOrderBy("asc")

        const rows = options.includeListPrice
            ? await prisma.productVariant.findMany({
                where: variantWhere,
                orderBy: variantOrderBy,
                include: { ...structure, variantSuppliers: variantSupplierPriceSelect },
            })
            : await prisma.productVariant.findMany({
                where: variantWhere,
                orderBy: variantOrderBy,
                include: structure,
            })

        return { rows, columns }
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
        getProductVariantsByMeasurementKey,
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
