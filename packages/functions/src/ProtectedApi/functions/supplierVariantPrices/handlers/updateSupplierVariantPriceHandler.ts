import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    ISupplierVariantPriceDependencies,
    IUpdateSupplierVariantPriceEvent,
} from "@/functions/ProtectedApi/types/supplierVariantPrices"

export const updateSupplierVariantPriceHandler =
    ({ productVariantSupplierRepository }: ISupplierVariantPriceDependencies) =>
        async (event: IUpdateSupplierVariantPriceEvent) => {
            const user = event.user
            if (!user) {
                throw new createError.Forbidden("User context missing")
            }

            const { id } = event.pathParameters
            const { price, currency } = event.body

            const existing = await productVariantSupplierRepository.getProductVariantSupplier(id)
            if (!existing) throw new createError.NotFound("Variant supplier record not found")

            const canBypassSupplierOwnership = user.isOwner || user.isAdmin

            if (!canBypassSupplierOwnership && (!user.isSupplier || !user.supplierId)) {
                throw new createError.Forbidden("Supplier context missing")
            }

            if (!canBypassSupplierOwnership && existing.supplierId !== user.supplierId) {
                throw new createError.Forbidden("You can only update your own supplier prices")
            }

            const updated = await productVariantSupplierRepository.updateProductVariantSupplier(id, {
                price,
                ...(currency && { currency: currency.toUpperCase() }),
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: { productVariantSupplier: updated },
            })
        }
