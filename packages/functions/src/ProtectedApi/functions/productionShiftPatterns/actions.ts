import { lambdaHandler } from "@/core/middy"
import { productionShiftPatternRepository } from "@/core/helpers/prisma/productionShiftPatterns/repository"
import {
    createShiftPatternHandler,
    deleteShiftPatternHandler,
    listShiftPatternsHandler,
    replaceShiftPatternHandler,
} from "@/functions/ProtectedApi/functions/productionShiftPatterns/handlers"
import {
    createShiftPatternValidator,
    deleteShiftPatternResponseValidator,
    deleteShiftPatternValidator,
    listShiftPatternsResponseValidator,
    replaceShiftPatternValidator,
    shiftPatternResponseValidator,
} from "@/functions/ProtectedApi/validators/productionShiftPatterns"
import { PRODUCTION_PLANNER_GROUPS } from "@/functions/shared/production/access"
import { withProductionChange } from "@/functions/shared/production/realtime"
import type {
    ICreateShiftPatternEvent,
    IDeleteShiftPatternEvent,
    IListShiftPatternsEvent,
    IReplaceShiftPatternEvent,
} from "@/functions/ProtectedApi/types/productionShiftPatterns"


const deps = () => ({
    productionShiftPatternRepository: productionShiftPatternRepository(),
})

export const listShiftPatterns = lambdaHandler(
    async (event) => listShiftPatternsHandler(deps())(event as IListShiftPatternsEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        responseValidator: listShiftPatternsResponseValidator,
    },
)

export const createShiftPattern = lambdaHandler(
    withProductionChange("definitions", async (event) => createShiftPatternHandler(deps())(event as ICreateShiftPatternEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: createShiftPatternValidator,
        responseValidator: shiftPatternResponseValidator,
    },
)

export const replaceShiftPattern = lambdaHandler(
    withProductionChange("definitions", async (event) => replaceShiftPatternHandler(deps())(event as IReplaceShiftPatternEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: replaceShiftPatternValidator,
        responseValidator: shiftPatternResponseValidator,
    },
)

export const deleteShiftPattern = lambdaHandler(
    withProductionChange("definitions", async (event) => deleteShiftPatternHandler(deps())(event as IDeleteShiftPatternEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: deleteShiftPatternValidator,
        responseValidator: deleteShiftPatternResponseValidator,
    },
)
