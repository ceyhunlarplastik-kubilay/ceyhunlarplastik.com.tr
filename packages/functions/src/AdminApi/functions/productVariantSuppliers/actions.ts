import { lambdaHandler } from "@/core/middy"
import { productVariantSupplierRepository } from "@/core/helpers/prisma/productVariantSuppliers/repository"
import { productVariantRepository } from "@/core/helpers/prisma/productVariants/repository"
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository"

import {
    createProductVariantSupplierHandler,
    getProductVariantSupplierHandler,
    listProductVariantSuppliersHandler,
    deleteProductVariantSupplierHandler,
    updateProductVariantSupplierHandler,
} from "@/functions/AdminApi/functions/productVariantSuppliers/handlers"
import {
    createProductVariantSupplierValidator,
    updateProductVariantSupplierValidator,
    idValidator,
} from "@/functions/AdminApi/validators/productVariantSuppliers"
import type {
    IProductVariantSupplierDependencies,
    ICreateProductVariantSupplierEvent,
    IGetProductVariantSupplierEvent,
    IListProductVariantSuppliersEvent,
    IDeleteProductVariantSupplierEvent,
    IUpdateProductVariantSupplierEvent,
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
    }
)
