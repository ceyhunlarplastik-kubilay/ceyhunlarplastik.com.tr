import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"

import {
    IListProductsDependencies,
    IListProductsEvent,
} from "@/functions/AdminApi/types/products"

const ALLOWED_SORT_FIELDS = ["code", "name", "createdAt"] as const

export const listProductsHandler =
    ({ productRepository }: IListProductsDependencies) =>
        async (event: IListProductsEvent) => {

            const query = event.queryStringParameters ?? {}

            const { page, limit, search, sort, order } =
                normalizeListQuery(query, {
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
                })

                return apiResponseDTO({
                    statusCode: 200,
                    payload: {
                        data: result.data,
                        meta: result.meta,
                    },
                })
            } catch (err) {
                console.error(err)
                throw new createError.InternalServerError(
                    "An error occurred while listing products"
                )
            }
        }
