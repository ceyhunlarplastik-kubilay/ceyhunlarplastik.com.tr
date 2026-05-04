import createError from "http-errors"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    ISupplierVariantPriceDependencies,
    IListSupplierVariantPricesEvent,
} from "@/functions/ProtectedApi/types/supplierVariantPrices"

const ALLOWED_SORT_FIELDS = ["updatedAt", "createdAt", "pricingUpdatedAt"] as const

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
                ((user.isOwner || user.isAdmin || user.isPurchasing || user.isSales)
                    ? query.supplierId
                    : undefined)

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

            const path = event.rawPath ?? ""
            const isPurchasingRoute = path.startsWith("/purchasing/")
            const isSalesRoute = path.startsWith("/sales/")
            const canSeeAllPricing = user.isOwner || user.isAdmin

            const projectedData = result.data.map((item) => {
                if (canSeeAllPricing) return item

                if (isSalesRoute) {
                    return {
                        ...item,
                        price: undefined,
                        profitRate: undefined,
                    }
                }

                if (isPurchasingRoute) {
                    return {
                        ...item,
                        profitRate: undefined,
                        listPrice: undefined,
                    }
                }

                if (user.isSupplier || user.isPurchasing) {
                    return {
                        ...item,
                        profitRate: undefined,
                        listPrice: undefined,
                    }
                }

                if (user.isSales) {
                    return {
                        ...item,
                        price: undefined,
                        profitRate: undefined,
                    }
                }

                return item
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    data: projectedData,
                    meta: result.meta,
                },
            })
        }
