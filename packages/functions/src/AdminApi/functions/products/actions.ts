import { lambdaHandler } from "@/core/middy"
import { productRepository } from "@/core/helpers/prisma/products/repository"
import { categoryRepository } from "@/core/helpers/prisma/categories/repository"

import {
    listProductsHandler,
    createProductHandler,
    getProductHandler,
    updateProductHandler,
    deleteProductHandler
} from "@/functions/AdminApi/functions/products/handlers";

import { createProductValidator, updateProductValidator, idValidator } from "@/functions/AdminApi/validators/products"

import type {
    IListProductsEvent,
    ICreateProductEvent,
    IGetProductEvent,
    IUpdateProductEvent,
    IDeleteProductEvent,
} from "@/functions/AdminApi/types/products"

export const listProducts = lambdaHandler(
    async (event) =>
        listProductsHandler({
            productRepository: productRepository(),
        })(event as IListProductsEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] }
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
    }
)
