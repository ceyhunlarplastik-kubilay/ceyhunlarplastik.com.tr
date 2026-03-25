import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { IProductDependencies, IListProductsEvent } from "@/functions/PublicApi/types/products"
import { mapProductWithAssets } from "@/core/helpers/assets/mapProductWithAssets"

const ALLOWED_SORT_FIELDS = ["code", "name", "createdAt"] as const

export const listProductsHandler =
    ({ productRepository }: IProductDependencies) =>
        async (event: IListProductsEvent) => {

            const query = event.queryStringParameters ?? {}

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
                        "category" // 🔥 BUNU EKLE
                    ].includes(key)
            )


            const { page, limit, search, sort, order } =
                normalizeListQuery(event.queryStringParameters, {
                    allowedSortFields: ALLOWED_SORT_FIELDS,
                    defaultSort: "code",
                })

            try {
                const result = await productRepository.listProducts({
                    page,
                    limit,
                    search,
                    sort,
                    order,
                    categoryId: query.categoryId,
                    category: query.category,
                    attributeFilters,
                    attributeValueIds
                })

                return apiResponseDTO({
                    statusCode: 200,
                    payload: {
                        data: result.data.map(mapProductWithAssets),
                        meta: result.meta,
                    },
                })
            } catch (err) {
                console.error(err);
                throw new createError.InternalServerError("An error occurred while listing products");
            }
        }
