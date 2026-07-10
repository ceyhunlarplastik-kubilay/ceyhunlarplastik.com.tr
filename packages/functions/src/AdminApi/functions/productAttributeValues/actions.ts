import { lambdaHandler } from "@/core/middy"
import { productAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import { productAttributeRepository } from "@/core/helpers/prisma/productAttributes/repository"
import { assetRepository } from "@/core/helpers/prisma/assets/repository"

import {
    createProductAttributeValueHandler,
    listProductAttributeValuesHandler,
    updateProductAttributeValueHandler,
    deleteProductAttributeValueHandler,
    createProductAttributeValueAssetUploadHandler,
} from "./handlers"

import {
    createProductAttributeValueValidator,
    updateProductAttributeValueValidator,
    idValidator,
    createProductAttributeValueAssetUploadValidator,
    productAttributeValueResponseValidator,
    deleteProductAttributeValueResponseValidator,
    listProductAttributeValueResponseValidator,
} from "@/functions/AdminApi/validators/productAttributeValues"

const productAttributeValueManagerGroups = ["admin", "content_editor"]

export const createProductAttributeValue = lambdaHandler(
    async (event) => {
        return createProductAttributeValueHandler({
            productAttributeValueRepository: productAttributeValueRepository(),
            productAttributeRepository: productAttributeRepository(),
            assetRepository: assetRepository(),
        })(event as any)
    },
    {
        auth: { requiredPermissionGroups: productAttributeValueManagerGroups },
        requestValidator: createProductAttributeValueValidator,
        responseValidator: productAttributeValueResponseValidator,
    }
)

export const listProductAttributeValues = lambdaHandler(
    async (event) => {
        return listProductAttributeValuesHandler({
            productAttributeValueRepository: productAttributeValueRepository(),
            productAttributeRepository: productAttributeRepository(),
            assetRepository: assetRepository(),
        })(event as any)
    },
    {
        auth: { requiredPermissionGroups: productAttributeValueManagerGroups },
        responseValidator: listProductAttributeValueResponseValidator,
    }
)

// Backward-compat alias:
// GET /product-attribute-values/{id} route points here and uses {id} as attributeId.
export const getProductAttributeValue = lambdaHandler(
    async (event) => {
        return listProductAttributeValuesHandler({
            productAttributeValueRepository: productAttributeValueRepository(),
            productAttributeRepository: productAttributeRepository(),
            assetRepository: assetRepository(),
        })(event as any)
    },
    {
        auth: { requiredPermissionGroups: productAttributeValueManagerGroups },
        requestValidator: idValidator,
        responseValidator: listProductAttributeValueResponseValidator,
    }
)

export const updateProductAttributeValue = lambdaHandler(
    async (event) => {
        return updateProductAttributeValueHandler({
            productAttributeValueRepository: productAttributeValueRepository(),
            productAttributeRepository: productAttributeRepository(),
            assetRepository: assetRepository(),
        })(event as any)
    },
    {
        auth: { requiredPermissionGroups: productAttributeValueManagerGroups },
        requestValidator: updateProductAttributeValueValidator,
        responseValidator: productAttributeValueResponseValidator,
    }
)

export const deleteProductAttributeValue = lambdaHandler(
    async (event) => {
        return deleteProductAttributeValueHandler({
            productAttributeValueRepository: productAttributeValueRepository(),
            productAttributeRepository: productAttributeRepository(),
            assetRepository: assetRepository(),
        })(event as any)
    },
    {
        auth: { requiredPermissionGroups: productAttributeValueManagerGroups },
        requestValidator: idValidator,
        responseValidator: deleteProductAttributeValueResponseValidator,
    }
)

export const createProductAttributeValueAssetUpload = lambdaHandler(
    async (event) => {
        return createProductAttributeValueAssetUploadHandler({
            productAttributeValueRepository: productAttributeValueRepository(),
        })(event as any)
    },
    {
        auth: { requiredPermissionGroups: productAttributeValueManagerGroups },
        requestValidator: createProductAttributeValueAssetUploadValidator,
    }
)
