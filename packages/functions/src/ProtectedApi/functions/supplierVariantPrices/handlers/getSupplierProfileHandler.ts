import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    IGetSupplierProfileEvent,
    ISupplierVariantPriceDependencies,
} from "@/functions/ProtectedApi/types/supplierVariantPrices"

export const getSupplierProfileHandler =
    ({ supplierRepository }: ISupplierVariantPriceDependencies) =>
        async (event: IGetSupplierProfileEvent) => {
            const user = event.user
            if (!user) throw new createError.Forbidden("User context missing")

            if (!user.supplierId) {
                return apiResponseDTO({
                    statusCode: 200,
                    payload: { supplier: null },
                })
            }

            const supplier = await supplierRepository.getSupplier(user.supplierId)

            return apiResponseDTO({
                statusCode: 200,
                payload: { supplier },
            })
        }

