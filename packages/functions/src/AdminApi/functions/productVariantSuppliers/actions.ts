import { lambdaHandler } from "@/core/middy"
import { productVariantSupplierRepository } from "@/core/helpers/prisma/productVariantSuppliers/repository"
import { productVariantRepository } from "@/core/helpers/prisma/productVariants/repository"
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository"

import {
    createProductVariantSupplierHandler,
    getProductVariantSupplierHandler,
    listProductVariantSuppliersHandler,
    listSupplierProductsHandler,
    deleteProductVariantSupplierHandler,
    updateProductVariantSupplierHandler,
    bulkUpdateProductVariantSupplierPricingHandler,
} from "@/functions/AdminApi/functions/productVariantSuppliers/handlers"
import {
    createProductVariantSupplierValidator,
    updateProductVariantSupplierValidator,
    idValidator,
    productVariantSupplierResponseValidator,
    listProductVariantSuppliersResponseValidator,
    listSupplierProductsResponseValidator,
    bulkUpdateProductVariantSupplierPricingValidator,
} from "@/functions/AdminApi/validators/productVariantSuppliers"
import type {
    IProductVariantSupplierDependencies,
    ICreateProductVariantSupplierEvent,
    IGetProductVariantSupplierEvent,
    IListProductVariantSuppliersEvent,
    IListSupplierProductsEvent,
    IDeleteProductVariantSupplierEvent,
    IUpdateProductVariantSupplierEvent,
    IBulkUpdateProductVariantSupplierPricingEvent,
} from "@/functions/AdminApi/types/productVariantSuppliers"

const getDeps = (): IProductVariantSupplierDependencies => ({
    productVariantSupplierRepository: productVariantSupplierRepository(),
    productVariantRepository: productVariantRepository(),
    supplierRepository: supplierRepository(),
})

export const createProductVariantSupplier = lambdaHandler(
    async (event) => {
        return createProductVariantSupplierHandler(getDeps())(
            event as ICreateProductVariantSupplierEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: createProductVariantSupplierValidator,
        responseValidator: productVariantSupplierResponseValidator,
    }
)

export const getProductVariantSupplier = lambdaHandler(
    async (event) => {
        return getProductVariantSupplierHandler(getDeps())(
            event as IGetProductVariantSupplierEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: idValidator,
        // responseValidator: productVariantSupplierResponseValidator,
    }
)

export const listProductVariantSuppliers = lambdaHandler(
    async (event) => {
        return listProductVariantSuppliersHandler(getDeps())
            (
                event as IListProductVariantSuppliersEvent
            )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        responseValidator: listProductVariantSuppliersResponseValidator,
    }
)

export const listSupplierProducts = lambdaHandler(
    async (event) => {
        return listSupplierProductsHandler(getDeps())(
            event as IListSupplierProductsEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        responseValidator: listSupplierProductsResponseValidator,
    }
)

export const deleteProductVariantSupplier = lambdaHandler(
    async (event) => {
        return deleteProductVariantSupplierHandler(getDeps())(
            event as IDeleteProductVariantSupplierEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: idValidator,
    }
)

export const updateProductVariantSupplier = lambdaHandler(
    async (event) => {
        return updateProductVariantSupplierHandler(getDeps())(
            event as IUpdateProductVariantSupplierEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: updateProductVariantSupplierValidator,
        responseValidator: productVariantSupplierResponseValidator,
    }
)

export const bulkUpdateProductVariantSupplierPricing = lambdaHandler(
    async (event) => {
        return bulkUpdateProductVariantSupplierPricingHandler(getDeps())(
            event as IBulkUpdateProductVariantSupplierPricingEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: bulkUpdateProductVariantSupplierPricingValidator,
    }
)
