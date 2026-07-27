import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { IProductDependencies, IListProductsEvent } from "@/functions/PublicApi/types/products"
import { mapProductWithAssets } from "@/core/helpers/assets/mapProductWithAssets"
import {
    DATABASE_CONNECTION_CAPACITY_MESSAGE,
    isDatabaseConnectionCapacityError,
} from "@/core/helpers/prisma/errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import {
    getSupportedLocale,
    isSupportedLocale,
} from "@/core/i18n/locales"

const ALLOWED_SORT_FIELDS = ["code", "name", "createdAt"] as const

/**
 * Kart görünümü DTO'su (`?view=card`).
 *
 * Ölçüm (20 ürün, profil-tapalari): tam yanıt 113KB — dağılım attributeValues %49.6,
 * category %27.5, assets %7.9, translations %5.1. Katalog kartı ise yalnız
 * `name, code, slug`, PRIMARY/IMAGE asset url'i ve attributeValue'ların
 * `id/name/attribute.code/attribute.name` alanlarını gösteriyor → ~19KB yeter (%83 az).
 *
 * NEDEN OPT-IN: aynı endpoint'i müşteri portalı ve admin özel-fiyat/varyant ekranları da
 * kullanıyor ve onlar `product.category`'yi okuyor. Koşulsuz daraltma o yüzeyleri bozardı.
 *
 * NEDEN BURADA (repository include'unda değil): `mapProductWithAssets` lokalizasyon ve
 * sector/production_group hiyerarşisini türetmek için translations + derin parentValue
 * zincirini KULLANIYOR. Include daraltılırsa yerelleştirme bozulur; bu yüzden veri
 * map'lendikten SONRA yanıttan atılır.
 */
function toProductCardDTO(product: any) {
    return {
        id: product.id,
        code: product.code,
        name: product.name,
        slug: product.slug,
        categoryId: product.categoryId,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        assets: (product.assets ?? [])
            .filter((asset: any) => asset?.role === "PRIMARY" || asset?.type === "IMAGE")
            .map((asset: any) => ({
                id: asset.id,
                role: asset.role,
                type: asset.type,
                url: asset.url,
            })),
        attributeValues: (product.attributeValues ?? []).map((value: any) => ({
            id: value.id,
            name: value.name,
            attribute: value.attribute
                ? { code: value.attribute.code, name: value.attribute.name }
                : undefined,
        })),
    }
}

export const listProductsHandler =
    ({ productRepository, categoryRepository }: IProductDependencies) =>
        async (event: IListProductsEvent) => {

            const query = event.queryStringParameters ?? {}

            if (query.locale && !isSupportedLocale(query.locale)) {
                throw new createError.BadRequest("Unsupported locale")
            }

            const locale = getSupportedLocale(query.locale)

            /* const attributeFilters = Object.entries(query).filter(
                ([key]) =>
                    !["page", "limit", "search", "sort", "order", "categoryId"].includes(key)
            ); */
            const attributeValueIds =
                typeof query.attributeValueIds === "string"
                    ? query.attributeValueIds.split(",")
                    : Array.isArray(query.attributeValueIds)
                        ? query.attributeValueIds
                        : []
            /* const attributeFilters = await Promise.all(
                Object.entries(query)
                    .filter(([key]) =>
                        !["page", "limit", "search", "sort", "order", "categoryId"].includes(key)
                    )
                    .map(async ([code, value]) => {

                        const slugs = typeof value === "string"
                            ? value.split(",")
                            : []

                        // 🔥 attribute value id bul
                        const values = await attributeValueRepository.findBySlugs(slugs)

                        return {
                            code,
                            valueIds: values.map(v => v.id)
                        }
                    })
            ) */
            const attributeFilters = Object.entries(query).filter(
                ([key]) =>
                    ![
                        "page",
                        "limit",
                        "search",
                        "sort",
                        "order",
                        "categoryId",
                        "category",
                        "attributeValueIds",
                        "locale",
                        // "view" bilinen bir parametredir; burada dışlanmazsa attribute
                        // filtresi sanılır ve sorgu sonucunu bozar.
                        "view",
                    ].includes(key)
            )


            const { page, limit, search, sort, order } =
                normalizeListQuery(event.queryStringParameters, {
                    allowedSortFields: ALLOWED_SORT_FIELDS,
                    defaultSort: "code",
                })

            try {
                let categoryId = query.categoryId

                if (query.category) {
                    try {
                        categoryId = (
                            await categoryRepository.getCategoryBySlug(query.category, locale)
                        ).id
                    } catch (error) {
                        if (
                            error instanceof Prisma.PrismaClientKnownRequestError &&
                            error.code === "P2025"
                        ) {
                            categoryId = "__missing_category__"
                        } else {
                            throw error
                        }
                    }
                }

                // Public liste yüzeyleri (katalog kartları, benzer ürünler) industrialUsages
                // kullanmaz; card view bu ilişkiyi hiç taşımayarak 6MB Lambda yanıt
                // limitine takılmayı önler. Detay endpoint'leri full include'da kalır.
                const result = await productRepository.listProducts({
                    page,
                    limit,
                    search,
                    sort,
                    order,
                    locale,
                    categoryId,
                    attributeFilters,
                    attributeValueIds
                }, { view: "card" })

                const mapped = result.data.map((product) => mapProductWithAssets(product, locale))

                return apiResponseDTO({
                    statusCode: 200,
                    payload: {
                        // `?view=card`: katalog kartının kullanmadığı alanlar yanıttan atılır.
                        data: query.view === "card" ? mapped.map(toProductCardDTO) : mapped,
                        meta: result.meta,
                    },
                })
            } catch (err) {
                console.error(err);
                if (isDatabaseConnectionCapacityError(err)) {
                    throw new createError.ServiceUnavailable(DATABASE_CONNECTION_CAPACITY_MESSAGE)
                }

                throw new createError.InternalServerError("An error occurred while listing products");
            }
        }
