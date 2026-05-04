import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    ISupplierVariantPriceDependencies,
    IUpdateSupplierProfileEvent,
} from "@/functions/ProtectedApi/types/supplierVariantPrices"

export const updateSupplierProfileHandler =
    ({ supplierRepository }: ISupplierVariantPriceDependencies) =>
        async (event: IUpdateSupplierProfileEvent) => {
            const user = event.user
            if (!user) throw new createError.Forbidden("User context missing")

            const body = event.body ?? {}
            if (Object.keys(body).length === 0) {
                throw new createError.BadRequest("At least one field must be provided")
            }

            const supplierId = user.supplierId
            if (!supplierId) throw new createError.Forbidden("Supplier context missing")

            const supplier = await supplierRepository.updateSupplier(supplierId, {
                ...(body.name !== undefined ? { name: body.name.trim() } : {}),
                ...(body.contactName !== undefined ? { contactName: body.contactName.trim() } : {}),
                ...(body.phone !== undefined ? { phone: body.phone.trim() } : {}),
                ...(body.address !== undefined ? { address: body.address.trim() } : {}),
                ...(body.taxNumber !== undefined ? { taxNumber: body.taxNumber.trim() } : {}),
                ...(body.defaultPaymentTermDays !== undefined
                    ? { defaultPaymentTermDays: body.defaultPaymentTermDays }
                    : {}),
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: { supplier },
            })
        }
