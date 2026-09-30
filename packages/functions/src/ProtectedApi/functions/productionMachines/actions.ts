import { lambdaHandler } from "@/core/middy"
import { productionAreaRepository } from "@/core/helpers/prisma/productionAreas/repository"
import { productionMachineRepository } from "@/core/helpers/prisma/productionMachines/repository"
import { productionShiftPatternRepository } from "@/core/helpers/prisma/productionShiftPatterns/repository"
import {
    createProductionMachineHandler,
    deleteProductionMachineHandler,
    getProductionMachineHandler,
    listProductionMachinesHandler,
    updateProductionMachineHandler,
} from "@/functions/ProtectedApi/functions/productionMachines/handlers"
import {
    createProductionMachineValidator,
    deleteProductionMachineResponseValidator,
    deleteProductionMachineValidator,
    getProductionMachineValidator,
    listProductionMachinesResponseValidator,
    productionMachineResponseValidator,
    updateProductionMachineValidator,
} from "@/functions/ProtectedApi/validators/productionMachines"
import { PRODUCTION_PLANNER_GROUPS } from "@/functions/shared/production/access"
import { withProductionChange } from "@/functions/shared/production/realtime"
import type {
    ICreateProductionMachineEvent,
    IDeleteProductionMachineEvent,
    IGetProductionMachineEvent,
    IListProductionMachinesEvent,
    IUpdateProductionMachineEvent,
} from "@/functions/ProtectedApi/types/productionMachines"


const deps = () => ({
    productionMachineRepository: productionMachineRepository(),
    productionAreaRepository: productionAreaRepository(),
    productionShiftPatternRepository: productionShiftPatternRepository(),
})

export const listProductionMachines = lambdaHandler(
    async (event) => listProductionMachinesHandler(deps())(event as IListProductionMachinesEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        responseValidator: listProductionMachinesResponseValidator,
    },
)

export const getProductionMachine = lambdaHandler(
    async (event) => getProductionMachineHandler(deps())(event as IGetProductionMachineEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: getProductionMachineValidator,
        responseValidator: productionMachineResponseValidator,
    },
)

export const createProductionMachine = lambdaHandler(
    withProductionChange("definitions", async (event) => createProductionMachineHandler(deps())(event as ICreateProductionMachineEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: createProductionMachineValidator,
        responseValidator: productionMachineResponseValidator,
    },
)

export const updateProductionMachine = lambdaHandler(
    withProductionChange("definitions", async (event) => updateProductionMachineHandler(deps())(event as IUpdateProductionMachineEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: updateProductionMachineValidator,
        responseValidator: productionMachineResponseValidator,
    },
)

export const deleteProductionMachine = lambdaHandler(
    withProductionChange("definitions", async (event) => deleteProductionMachineHandler(deps())(event as IDeleteProductionMachineEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: deleteProductionMachineValidator,
        responseValidator: deleteProductionMachineResponseValidator,
    },
)
