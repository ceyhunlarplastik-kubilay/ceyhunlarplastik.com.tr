import { lambdaHandler } from "@/core/middy"
import { productionAreaRepository } from "@/core/helpers/prisma/productionAreas/repository"
import { productionShiftPatternRepository } from "@/core/helpers/prisma/productionShiftPatterns/repository"
import {
    createProductionAreaHandler,
    deleteProductionAreaHandler,
    listProductionAreasHandler,
    updateProductionAreaHandler,
} from "@/functions/ProtectedApi/functions/productionAreas/handlers"
import {
    createProductionAreaValidator,
    deleteProductionAreaResponseValidator,
    deleteProductionAreaValidator,
    listProductionAreasResponseValidator,
    productionAreaResponseValidator,
    updateProductionAreaValidator,
} from "@/functions/ProtectedApi/validators/productionAreas"
import { PRODUCTION_PLANNER_GROUPS } from "@/functions/shared/production/access"
import { withProductionChange } from "@/functions/shared/production/realtime"
import type {
    ICreateProductionAreaEvent,
    IDeleteProductionAreaEvent,
    IListProductionAreasEvent,
    IUpdateProductionAreaEvent,
} from "@/functions/ProtectedApi/types/productionAreas"


const deps = () => ({
    productionAreaRepository: productionAreaRepository(),
    productionShiftPatternRepository: productionShiftPatternRepository(),
})

export const listProductionAreas = lambdaHandler(
    async (event) => listProductionAreasHandler(deps())(event as IListProductionAreasEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        responseValidator: listProductionAreasResponseValidator,
    },
)

export const createProductionArea = lambdaHandler(
    withProductionChange("definitions", async (event) => createProductionAreaHandler(deps())(event as ICreateProductionAreaEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: createProductionAreaValidator,
        responseValidator: productionAreaResponseValidator,
    },
)

export const updateProductionArea = lambdaHandler(
    withProductionChange("definitions", async (event) => updateProductionAreaHandler(deps())(event as IUpdateProductionAreaEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: updateProductionAreaValidator,
        responseValidator: productionAreaResponseValidator,
    },
)

export const deleteProductionArea = lambdaHandler(
    withProductionChange("definitions", async (event) => deleteProductionAreaHandler(deps())(event as IDeleteProductionAreaEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: deleteProductionAreaValidator,
        responseValidator: deleteProductionAreaResponseValidator,
    },
)
