import { lambdaHandler } from "@/core/middy"
import { productVariantSupplierRepository } from "@/core/helpers/prisma/productVariantSuppliers/repository"
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository"
import {
    listSupplierVariantPricesHandler,
    listSupplierProductsHandler,
    getSupplierProfileHandler,
    updateSupplierProfileHandler,
    updateSupplierVariantPriceHandler,
} from "@/functions/ProtectedApi/functions/supplierVariantPrices/handlers"
import type {
    IGetSupplierProfileEvent,
    IListSupplierProductsEvent,
    ISupplierVariantPriceDependencies,
    IListSupplierVariantPricesEvent,
    IUpdateSupplierProfileEvent,
    IUpdateSupplierVariantPriceEvent,
} from "@/functions/ProtectedApi/types/supplierVariantPrices"
import {
    listSupplierProductsResponseValidator,
    supplierProfileResponseValidator,
    listSupplierVariantPricesResponseValidator,
    supplierVariantPriceResponseValidator,
    updateSupplierProfileValidator,
    updateSupplierVariantPriceValidator,
} from "@/functions/ProtectedApi/validators/supplierVariantPrices"

const getDeps = (): ISupplierVariantPriceDependencies => ({
    productVariantSupplierRepository: productVariantSupplierRepository(),
    supplierRepository: supplierRepository(),
})

export const listSupplierVariantPrices = lambdaHandler(
    async (event) => {
        return listSupplierVariantPricesHandler(getDeps())(
            event as IListSupplierVariantPricesEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["supplier", "purchasing", "sales", "admin", "owner"] },
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
        auth: { requiredPermissionGroups: ["supplier", "purchasing", "admin", "owner"] },
        /* auth: false, */
        requestValidator: updateSupplierVariantPriceValidator,
        responseValidator: supplierVariantPriceResponseValidator,
    }
)

export const listSupplierProducts = lambdaHandler(
    async (event) => {
        return listSupplierProductsHandler(getDeps())(
            event as IListSupplierProductsEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["supplier", "purchasing", "sales", "admin", "owner"] },
        responseValidator: listSupplierProductsResponseValidator,
    }
)

export const getSupplierProfile = lambdaHandler(
    async (event) => {
        return getSupplierProfileHandler(getDeps())(
            event as IGetSupplierProfileEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["supplier", "purchasing", "sales", "admin", "owner"] },
        responseValidator: supplierProfileResponseValidator,
    }
)

export const updateSupplierProfile = lambdaHandler(
    async (event) => {
        return updateSupplierProfileHandler(getDeps())(
            event as IUpdateSupplierProfileEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["supplier", "admin", "owner"] },
        requestValidator: updateSupplierProfileValidator,
        responseValidator: supplierProfileResponseValidator,
    }
)
