import { lambdaHandler } from "@/core/middy"
import { assetRepository } from "@/core/helpers/prisma/assets/repository"
import { productRepository } from "@/core/helpers/prisma/products/repository"
import { categoryRepository } from "@/core/helpers/prisma/categories/repository"
import { productVariantRepository } from "@/core/helpers/prisma/productVariants/repository"

import {
    createAssetHandler,
    deleteAssetHandler,
    getAssetHandler,
    listAssetsHandler,
    updateAssetHandler,
} from "@/functions/AdminApi/functions/assets/handlers"

import {
    ICreateAssetEvent,
    IDeleteAssetEvent,
    IGetAssetEvent,
    IListAssetsEvent,
    IUpdateAssetEvent,
} from "@/functions/AdminApi/types/assets"

import {
    createAssetValidator,
    idValidator,
    updateAssetValidator,
} from "@/functions/AdminApi/validators/assets"

export const listAssets = lambdaHandler(
    async (event) =>
        listAssetsHandler({
            assetRepository: assetRepository(),
        })(event as IListAssetsEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
    }
)

export const getAsset = lambdaHandler(
    async (event) =>
        getAssetHandler({
            assetRepository: assetRepository(),
        })(event as IGetAssetEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: idValidator,
    }
)

export const createAsset = lambdaHandler(
    async (event) =>
        createAssetHandler({
            assetRepository: assetRepository(),
            productRepository: productRepository(),
            categoryRepository: categoryRepository(),
            productVariantRepository: productVariantRepository(),
        })(event as ICreateAssetEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: createAssetValidator,
    }
)

export const updateAsset = lambdaHandler(
    async (event) =>
        updateAssetHandler({
            assetRepository: assetRepository(),
            productRepository: productRepository(),
            categoryRepository: categoryRepository(),
            productVariantRepository: productVariantRepository(),
        })(event as IUpdateAssetEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: updateAssetValidator,
    }
)

export const deleteAsset = lambdaHandler(
    async (event) =>
        deleteAssetHandler({
            assetRepository: assetRepository(),
        })(event as IDeleteAssetEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: idValidator,
    }
)
