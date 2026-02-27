import { lambdaHandler } from "@/core/middy"
import { productRepository } from "@/core/helpers/prisma/products/repository"
import { categoryRepository } from "@/core/helpers/prisma/categories/repository"

import {
    listProductsHandler,
    createProductHandler,
    getProductHandler,
    getProductBySlugHandler,
    updateProductHandler,
    deleteProductHandler
} from "@/functions/AdminApi/functions/products/handlers";

import {
    createProductValidator,
    updateProductValidator,
    idValidator,
    slugValidator,
    listProductsResponseValidator,
    productResponseValidator,
} from "@/functions/AdminApi/validators/products"

import type {
    IListProductsEvent,
    ICreateProductEvent,
    IGetProductEvent,
    IGetProductBySlugEvent,
    IUpdateProductEvent,
    IDeleteProductEvent,
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
