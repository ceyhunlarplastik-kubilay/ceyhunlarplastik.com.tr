import { lambdaHandler } from "@/core/middy"
import { productMeasurementRequirementRepository } from "@/core/helpers/prisma/productMeasurementRequirements/repository"
import { productRepository } from "@/core/helpers/prisma/products/repository"

import {
    listProductMeasurementRequirementsHandler,
    replaceProductMeasurementRequirementsHandler,
} from "@/functions/AdminApi/functions/productMeasurementRequirements/handlers"
import {
    idValidator,
    replaceMeasurementRequirementsValidator,
    measurementRequirementsResponseValidator,
} from "@/functions/AdminApi/validators/productMeasurementRequirements"
import type {
    IProductMeasurementRequirementDependencies,
    IListMeasurementRequirementsEvent,
    IReplaceMeasurementRequirementsEvent,
} from "@/functions/AdminApi/types/productMeasurementRequirements"

// Ölçü şablonu KATALOG verisidir; ticari alan taşımaz. Veri girişi operatörü de
// yönetebilir (owner rol hiyerarşisiyle zaten geçiyor).
const measurementRequirementManagerGroups = ["admin", "content_editor"]

const getDeps = (): IProductMeasurementRequirementDependencies => ({
    productMeasurementRequirementRepository: productMeasurementRequirementRepository(),
    productRepository: productRepository(),
})

export const listProductMeasurementRequirements = lambdaHandler(
    async (event) =>
        listProductMeasurementRequirementsHandler(getDeps())(event as IListMeasurementRequirementsEvent),
    {
        auth: { requiredPermissionGroups: measurementRequirementManagerGroups },
        requestValidator: idValidator,
        responseValidator: measurementRequirementsResponseValidator,
    }
)

export const replaceProductMeasurementRequirements = lambdaHandler(
    async (event) =>
        replaceProductMeasurementRequirementsHandler(getDeps())(event as IReplaceMeasurementRequirementsEvent),
    {
        auth: { requiredPermissionGroups: measurementRequirementManagerGroups },
        requestValidator: replaceMeasurementRequirementsValidator,
        responseValidator: measurementRequirementsResponseValidator,
    }
)
