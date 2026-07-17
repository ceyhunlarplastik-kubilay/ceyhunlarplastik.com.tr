import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { mapProductWithAssets } from "@/core/helpers/assets/mapProductWithAssets"
import {
    DATABASE_CONNECTION_CAPACITY_MESSAGE,
    isDatabaseConnectionCapacityError,
} from "@/core/helpers/prisma/errors"

import {
    IListProductsDependencies,
    IListProductsEvent,
} from "@/functions/AdminApi/types/products"

const ALLOWED_SORT_FIELDS = ["code", "name", "createdAt"] as const

export const listProductsHandler =
    ({ productRepository }: IListProductsDependencies) =>
        async (event: IListProductsEvent) => {

            const query = event.queryStringParameters ?? {};

            const { page, limit, search, sort, order } =
                normalizeListQuery(query, {
                    allowedSortFields: ALLOWED_SORT_FIELDS,
                    defaultSort: "code",
                })

            try {
                // P1.8(a): Admin listesi "card" view kullanır → ağır
                // industrialUsages derin zinciri listeden düşer (Lambda 6MB/413
                // riski). Edit dialog artık tam ürünü GET /products/{id} ile
                // ayrıca fetch ediyor; liste satırının derin ilişkilere ihtiyacı yok.
                const result = await productRepository.listProducts(
                    {
                        page,
                        limit,
                        search,
                        sort,
                        order,
                        categoryId: query.categoryId,
                    },
                    { view: "card" },
                )

                return apiResponseDTO({
                    statusCode: 200,
                    payload: {
                        data: result.data.map((product) => mapProductWithAssets(product)),
                        meta: result.meta,
                    },
                })
            } catch (err) {
                if (isDatabaseConnectionCapacityError(err)) {
                    throw new createError.ServiceUnavailable(DATABASE_CONNECTION_CAPACITY_MESSAGE)
                }

                throw new createError.InternalServerError("An error occurred while listing products");
            }
        }
