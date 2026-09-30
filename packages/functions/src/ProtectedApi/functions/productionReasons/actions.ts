import { lambdaHandler } from "@/core/middy"
import { productionReasonRepository } from "@/core/helpers/prisma/productionReasons/repository"
import {
    createDefaultProductionReasonsHandler,
    createProductionReasonHandler,
    deleteProductionReasonHandler,
    listProductionReasonsHandler,
    updateProductionReasonHandler,
} from "@/functions/ProtectedApi/functions/productionReasons/handlers"
import {
    createDefaultProductionReasonsResponseValidator,
    createProductionReasonValidator,
    deleteProductionReasonResponseValidator,
    deleteProductionReasonValidator,
    listProductionReasonsResponseValidator,
    productionReasonResponseValidator,
    updateProductionReasonValidator,
} from "@/functions/ProtectedApi/validators/productionReasons"
import { PRODUCTION_PLANNER_GROUPS } from "@/functions/shared/production/access"
import { withProductionChange } from "@/functions/shared/production/realtime"
import type {
    ICreateDefaultProductionReasonsEvent,
    ICreateProductionReasonEvent,
    IDeleteProductionReasonEvent,
    IListProductionReasonsEvent,
    IUpdateProductionReasonEvent,
} from "@/functions/ProtectedApi/types/productionReasons"

const deps = () => ({ productionReasonRepository: productionReasonRepository() })
const auth = { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS }

export const listProductionReasons = lambdaHandler(
    async (event) => listProductionReasonsHandler(deps())(event as IListProductionReasonsEvent),
    { auth, responseValidator: listProductionReasonsResponseValidator },
)

export const createProductionReason = lambdaHandler(
    withProductionChange("reasons", async (event) => createProductionReasonHandler(deps())(event as ICreateProductionReasonEvent)),
    { auth, requestValidator: createProductionReasonValidator, responseValidator: productionReasonResponseValidator },
)

export const updateProductionReason = lambdaHandler(
    withProductionChange("reasons", async (event) => updateProductionReasonHandler(deps())(event as IUpdateProductionReasonEvent)),
    { auth, requestValidator: updateProductionReasonValidator, responseValidator: productionReasonResponseValidator },
)

export const deleteProductionReason = lambdaHandler(
    withProductionChange("reasons", async (event) => deleteProductionReasonHandler(deps())(event as IDeleteProductionReasonEvent)),
    { auth, requestValidator: deleteProductionReasonValidator, responseValidator: deleteProductionReasonResponseValidator },
)

export const createDefaultProductionReasons = lambdaHandler(
    withProductionChange("reasons", async (event) => createDefaultProductionReasonsHandler(deps())(event as ICreateDefaultProductionReasonsEvent)),
    { auth, responseValidator: createDefaultProductionReasonsResponseValidator },
)
