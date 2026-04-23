import { lambdaHandler } from "@/core/middy"
import { productVariantSupplierRepository } from "@/core/helpers/prisma/productVariantSuppliers/repository"
import {
    listSupplierVariantPricesHandler,
    updateSupplierVariantPriceHandler,
} from "@/functions/ProtectedApi/functions/supplierVariantPrices/handlers"
import type {
    ISupplierVariantPriceDependencies,
    IListSupplierVariantPricesEvent,
    IUpdateSupplierVariantPriceEvent,
} from "@/functions/ProtectedApi/types/supplierVariantPrices"
import {
    listSupplierVariantPricesResponseValidator,
    supplierVariantPriceResponseValidator,
    updateSupplierVariantPriceValidator,
} from "@/functions/ProtectedApi/validators/supplierVariantPrices"

const getDeps = (): ISupplierVariantPriceDependencies => ({
    productVariantSupplierRepository: productVariantSupplierRepository(),
})

export const listSupplierVariantPrices = lambdaHandler(
    async (event) => {
        return listSupplierVariantPricesHandler(getDeps())(
            event as IListSupplierVariantPricesEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["supplier"] },
        // auth: false,
        responseValidator: listSupplierVariantPricesResponseValidator,
    }
)

export const updateSupplierVariantPrice = lambdaHandler(
    async (event) => {
        return updateSupplierVariantPriceHandler(getDeps())(
            event as IUpdateSupplierVariantPriceEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["supplier"] },
        /* auth: false, */
        requestValidator: updateSupplierVariantPriceValidator,
        responseValidator: supplierVariantPriceResponseValidator,
    }
)
