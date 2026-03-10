import { lambdaHandler } from "@/core/middy"
import { productRepository } from "@/core/helpers/prisma/products/repository"
import { categoryRepository } from "@/core/helpers/prisma/categories/repository"
import { assetRepository } from "@/core/helpers/prisma/assets/repository"

import {
    listProductsHandler,
    createProductHandler,
    getProductHandler,
    getProductBySlugHandler,
    updateProductHandler,
    deleteProductHandler,
    createProductAssetUploadHandler,
} from "@/functions/AdminApi/functions/products/handlers";

import {
    createProductValidator,
    updateProductValidator,
    idValidator,
    slugValidator,
    listProductsResponseValidator,
    productResponseValidator,
    createProductAssetUploadValidator,
} from "@/functions/AdminApi/validators/products"

import type {
    IListProductsEvent,
    ICreateProductEvent,
    IGetProductEvent,
    IGetProductBySlugEvent,
    IUpdateProductEvent,
    IDeleteProductEvent,
    ICreateProductAssetUploadEvent,
} from "@/functions/AdminApi/types/products"

export const listProducts = lambdaHandler(
    async (event) =>
        listProductsHandler({
            productRepository: productRepository(),
        })(event as IListProductsEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        responseValidator: listProductsResponseValidator,
    }
)

export const createProduct = lambdaHandler(
    async (event) =>
        createProductHandler({
            productRepository: productRepository(),
            categoryRepository: categoryRepository(),
            assetRepository: assetRepository(),
        })(event as ICreateProductEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: createProductValidator,
        responseValidator: productResponseValidator,
    }
)

export const getProduct = lambdaHandler(
    async (event) =>
        getProductHandler({
            productRepository: productRepository(),
        })(event as IGetProductEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: idValidator,
        responseValidator: productResponseValidator,
    }
)

export const getProductBySlug = lambdaHandler(
    async (event) =>
        getProductBySlugHandler({
            productRepository: productRepository(),
        })(event as IGetProductBySlugEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: slugValidator,
        responseValidator: productResponseValidator,
    }
)

export const updateProduct = lambdaHandler(
    async (event) =>
        updateProductHandler({
            productRepository: productRepository(),
            categoryRepository: categoryRepository(),
            assetRepository: assetRepository(),
        })(event as IUpdateProductEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: updateProductValidator,
        responseValidator: productResponseValidator,
    }
)

export const deleteProduct = lambdaHandler(
    async (event) =>
        deleteProductHandler({
            productRepository: productRepository(),
        })(event as IDeleteProductEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: idValidator,
        responseValidator: productResponseValidator,
    }
)

export const createProductAssetUpload = lambdaHandler(
    async (event) => {
        return createProductAssetUploadHandler()(
            event as ICreateProductAssetUploadEvent
        )
    },
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: createProductAssetUploadValidator,
    }
)
