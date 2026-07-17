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
                    categoryId,
                    attributeFilters,
                    attributeValueIds
                }, { view: "card" })

                return apiResponseDTO({
                    statusCode: 200,
                    payload: {
                        data: result.data.map((product) => mapProductWithAssets(product, locale)),
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
