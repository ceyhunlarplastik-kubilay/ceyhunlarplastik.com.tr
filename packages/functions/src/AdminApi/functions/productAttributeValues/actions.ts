import { lambdaHandler } from "@/core/middy"
import { productAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import { productAttributeRepository } from "@/core/helpers/prisma/productAttributes/repository"

import {
    createProductAttributeValueHandler,
    listProductAttributeValuesHandler,
    updateProductAttributeValueHandler,
    deleteProductAttributeValueHandler
} from "./handlers"

import {
    createProductAttributeValueValidator,
    updateProductAttributeValueValidator,
    idValidator
} from "@/functions/AdminApi/validators/productAttributeValues"

export const createProductAttributeValue = lambdaHandler(
    async (event) => {
        return createProductAttributeValueHandler({
            productAttributeValueRepository: productAttributeValueRepository(),
            productAttributeRepository: productAttributeRepository(),
        })(event as any)
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: createProductAttributeValueValidator
    }
)

export const listProductAttributeValues = lambdaHandler(
    async (event) => {
        return listProductAttributeValuesHandler({
            productAttributeValueRepository: productAttributeValueRepository(),
            productAttributeRepository: productAttributeRepository(),
        })(event as any)
    },
    {
        auth: { requiredPermissionGroups: ["admin"] }
    }
)

// Backward-compat alias:
// GET /product-attribute-values/{id} route points here and uses {id} as attributeId.
export const getProductAttributeValue = lambdaHandler(
    async (event) => {
        return listProductAttributeValuesHandler({
            productAttributeValueRepository: productAttributeValueRepository(),
            productAttributeRepository: productAttributeRepository(),
        })(event as any)
    },
    {
        auth: { requiredPermissionGroups: ["admin"] }
    }
)

export const updateProductAttributeValue = lambdaHandler(
    async (event) => {
        return updateProductAttributeValueHandler({
            productAttributeValueRepository: productAttributeValueRepository(),
            productAttributeRepository: productAttributeRepository(),
        })(event as any)
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: updateProductAttributeValueValidator
    }
)

export const deleteProductAttributeValue = lambdaHandler(
    async (event) => {
        return deleteProductAttributeValueHandler({
            productAttributeValueRepository: productAttributeValueRepository(),
            productAttributeRepository: productAttributeRepository(),
        })(event as any)
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: idValidator
    }
)
