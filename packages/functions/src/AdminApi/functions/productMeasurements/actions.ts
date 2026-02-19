import { lambdaHandler } from "@/core/middy"
import { productMeasurementRepository } from "@/core/helpers/prisma/productMeasurements/repository"
import { productVariantRepository } from "@/core/helpers/prisma/productVariants/repository"
import { measurementTypeRepository } from "@/core/helpers/prisma/measurementTypes/repository"

import {
    createProductMeasurementHandler,
    deleteProductMeasurementHandler,
    getProductMeasurementHandler,
    listProductMeasurementsHandler,
    updateProductMeasurementHandler,
} from "@/functions/AdminApi/functions/productMeasurements/handler"

import {
    ICreateProductMeasurementEvent,
    IDeleteProductMeasurementEvent,
    IGetProductMeasurementEvent,
    IListProductMeasurementsEvent,
    IUpdateProductMeasurementEvent,
} from "@/functions/AdminApi/types/productMeasurements"

import {
    createProductMeasurementValidator,
    idValidator,
    updateProductMeasurementValidator,
} from "@/functions/AdminApi/validators/productMeasurements"

export const listProductMeasurements = lambdaHandler(
    async (event) =>
        listProductMeasurementsHandler({
            productMeasurementRepository: productMeasurementRepository(),
        } as any)(event as IListProductMeasurementsEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
    }
)

export const getProductMeasurement = lambdaHandler(
    async (event) =>
        getProductMeasurementHandler({
            productMeasurementRepository: productMeasurementRepository(),
        } as any)(event as IGetProductMeasurementEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: idValidator,
    }
)

export const createProductMeasurement = lambdaHandler(
    async (event) =>
        createProductMeasurementHandler({
            productMeasurementRepository: productMeasurementRepository(),
            productVariantRepository: productVariantRepository(),
            measurementTypeRepository: measurementTypeRepository(),
        })(event as ICreateProductMeasurementEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: createProductMeasurementValidator,
    }
)

export const updateProductMeasurement = lambdaHandler(
    async (event) =>
        updateProductMeasurementHandler({
            productMeasurementRepository: productMeasurementRepository(),
            productVariantRepository: productVariantRepository(),
            measurementTypeRepository: measurementTypeRepository(),
        })(event as IUpdateProductMeasurementEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: updateProductMeasurementValidator,
    }
)

export const deleteProductMeasurement = lambdaHandler(
    async (event) =>
        deleteProductMeasurementHandler({
            productMeasurementRepository: productMeasurementRepository(),
        } as any)(event as IDeleteProductMeasurementEvent),
    {
        auth: { requiredPermissionGroups: ["admin"] },
        requestValidator: idValidator,
    }
)
