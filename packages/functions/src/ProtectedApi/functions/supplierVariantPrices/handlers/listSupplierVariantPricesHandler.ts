import createError from "http-errors"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    ISupplierVariantPriceDependencies,
    IListSupplierVariantPricesEvent,
} from "@/functions/ProtectedApi/types/supplierVariantPrices"

const ALLOWED_SORT_FIELDS = ["updatedAt", "createdAt"] as const

export const listSupplierVariantPricesHandler =
    ({ productVariantSupplierRepository }: ISupplierVariantPriceDependencies) =>
        async (event: IListSupplierVariantPricesEvent) => {
            const user = event.user

            if (!user) {
                throw new createError.Forbidden("User context missing")
            }

            const { page, limit, search, sort, order } = normalizeListQuery(
                event.queryStringParameters,
                {
                    allowedSortFields: ALLOWED_SORT_FIELDS,
                    defaultSort: "updatedAt",
                }
            )

            const query = event.queryStringParameters ?? {}

            const supplierIdFilter =
                user.supplierId ??
                ((user.isOwner || user.isAdmin) ? query.supplierId : undefined)

            if (user.isSupplier && !supplierIdFilter && !user.isOwner && !user.isAdmin) {
                throw new createError.Forbidden("Supplier context missing")
            }

            const result = await productVariantSupplierRepository.listProductVariantSuppliers({
                page,
                limit,
                search,
                sort,
                order,
                ...(supplierIdFilter && { supplierId: supplierIdFilter }),
                ...(query.variantId && { variantId: query.variantId }),
                ...(query.productId && { productId: query.productId }),
                ...(query.categoryId && { categoryId: query.categoryId }),
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: result,
            })
        }
