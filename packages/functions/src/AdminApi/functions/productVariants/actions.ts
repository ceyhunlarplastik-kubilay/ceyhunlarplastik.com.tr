import { lambdaHandler } from "@/core/middy"
import { productVariantRepository } from "@/core/helpers/prisma/productVariants/repository"
import { productRepository } from "@/core/helpers/prisma/products/repository";
import { materialRepository } from "@/core/helpers/prisma/materials/repository";
import { supplierRepository } from "@/core/helpers/prisma/suppliers/repository";

import {
    createProductVariantHandler,
    getProductVariantHandler,
    listProductVariantsHandler,
    deleteProductVariantHandler,
    updateProductVariantHandler,
} from "@/functions/AdminApi/functions/productVariants/handlers"
import {
    createProductVariantValidator,
    updateProductVariantValidator,
    idValidator,
    productVariantResponseValidator,
    listProductVariantResponseValidator,
} from "@/functions/AdminApi/validators/productVariants"
import type {
    IProductVariantDependencies,
    ICreateProductVariantEvent,
    IGetProductVariantEvent,
    IListProductVariantsEvent,
    IDeleteProductVariantEvent,
    IUpdateProductVariantEvent,
} from "@/functions/AdminApi/types/productVariants"

const getDeps = (): IProductVariantDependencies => ({
    productVariantRepository: productVariantRepository(),
    productRepository: productRepository(),
    materialRepository: materialRepository(),
    supplierRepository: supplierRepository(),
})

export const createProductVariant = lambdaHandler(
    async (event) => {
        return createProductVariantHandler(getDeps())(
            event as ICreateProductVariantEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: createProductVariantValidator,
        responseValidator: productVariantResponseValidator,
    }
)

export const getProductVariant = lambdaHandler(
    async (event) => {
        return getProductVariantHandler(getDeps())(
            event as IGetProductVariantEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: idValidator,
        responseValidator: productVariantResponseValidator,
    }
)

export const listProductVariants = lambdaHandler(
    async (event) => {
        return listProductVariantsHandler(getDeps())
            (
                event as IListProductVariantsEvent
            )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        responseValidator: listProductVariantResponseValidator,
    }
)

export const deleteProductVariant = lambdaHandler(
    async (event) => {
        return deleteProductVariantHandler(getDeps())(
            event as IDeleteProductVariantEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: idValidator,
        responseValidator: productVariantResponseValidator,
    }
)

export const updateProductVariant = lambdaHandler(
    async (event) => {
        return updateProductVariantHandler(getDeps())(
            event as IUpdateProductVariantEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: updateProductVariantValidator,
        responseValidator: productVariantResponseValidator,
    }
)
