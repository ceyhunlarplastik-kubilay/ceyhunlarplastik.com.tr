import { lambdaHandler } from "@/core/middy"
import {
    applyProductIndustrialUsageFunctionsHandler,
    getProductIndustrialUsageFunctionsHandler,
} from "@/functions/AdminApi/functions/industrialUsageFunctions/handlers"
import {
    applyProductIndustrialUsageFunctionsResponseValidator,
    applyProductIndustrialUsageFunctionsValidator,
    getProductIndustrialUsageFunctionsResponseValidator,
    getProductIndustrialUsageFunctionsValidator,
} from "@/functions/AdminApi/validators/industrialUsageFunctions"
import type {
    IApplyProductIndustrialUsageFunctionsEvent,
    IGetProductIndustrialUsageFunctionsEvent,
} from "@/functions/AdminApi/types/industrialUsageFunctions"

const industrialUsageFunctionManagerGroups = ["admin", "content_editor"]

export const getProductIndustrialUsageFunctions = lambdaHandler(
    async (event) =>
        getProductIndustrialUsageFunctionsHandler()(
            event as IGetProductIndustrialUsageFunctionsEvent,
        ),
    {
        auth: { requiredPermissionGroups: industrialUsageFunctionManagerGroups },
        requestValidator: getProductIndustrialUsageFunctionsValidator,
        responseValidator: getProductIndustrialUsageFunctionsResponseValidator,
    },
)

export const applyProductIndustrialUsageFunctions = lambdaHandler(
    async (event) =>
        applyProductIndustrialUsageFunctionsHandler()(
            event as IApplyProductIndustrialUsageFunctionsEvent,
        ),
    {
        auth: { requiredPermissionGroups: industrialUsageFunctionManagerGroups },
        requestValidator: applyProductIndustrialUsageFunctionsValidator,
        responseValidator: applyProductIndustrialUsageFunctionsResponseValidator,
    },
)
