import { lambdaHandler } from "@/core/middy"
import { productionOperatorRepository } from "@/core/helpers/prisma/productionOperators/repository"
import {
    createProductionOperatorHandler,
    deleteProductionOperatorHandler,
    listProductionOperatorsHandler,
    updateProductionOperatorHandler,
} from "@/functions/ProtectedApi/functions/productionOperators/handlers"
import {
    createProductionOperatorValidator,
    deleteProductionOperatorResponseValidator,
    deleteProductionOperatorValidator,
    listProductionOperatorsResponseValidator,
    productionOperatorResponseValidator,
    updateProductionOperatorValidator,
} from "@/functions/ProtectedApi/validators/productionOperators"
import { PRODUCTION_PLANNER_GROUPS } from "@/functions/shared/production/access"
import { withProductionChange } from "@/functions/shared/production/realtime"
import type {
    ICreateProductionOperatorEvent,
    IDeleteProductionOperatorEvent,
    IListProductionOperatorsEvent,
    IUpdateProductionOperatorEvent,
} from "@/functions/ProtectedApi/types/productionOperators"

const deps = () => ({
    productionOperatorRepository: productionOperatorRepository(),
})

export const listProductionOperators = lambdaHandler(
    async (event) => listProductionOperatorsHandler(deps())(event as IListProductionOperatorsEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        responseValidator: listProductionOperatorsResponseValidator,
    },
)

export const createProductionOperator = lambdaHandler(
    withProductionChange("definitions", async (event) => createProductionOperatorHandler(deps())(event as ICreateProductionOperatorEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: createProductionOperatorValidator,
        responseValidator: productionOperatorResponseValidator,
    },
)

export const updateProductionOperator = lambdaHandler(
    withProductionChange("definitions", async (event) => updateProductionOperatorHandler(deps())(event as IUpdateProductionOperatorEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: updateProductionOperatorValidator,
        responseValidator: productionOperatorResponseValidator,
    },
)

export const deleteProductionOperator = lambdaHandler(
    withProductionChange("definitions", async (event) => deleteProductionOperatorHandler(deps())(event as IDeleteProductionOperatorEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: deleteProductionOperatorValidator,
        responseValidator: deleteProductionOperatorResponseValidator,
    },
)
