import { lambdaHandler } from "@/core/middy"
import { productionMachineDowntimeRepository } from "@/core/helpers/prisma/productionMachineDowntimes/repository"
import { productionMachineRepository } from "@/core/helpers/prisma/productionMachines/repository"
import {
    createMachineDowntimeHandler,
    deleteMachineDowntimeHandler,
    listMachineDowntimesHandler,
    updateMachineDowntimeHandler,
} from "@/functions/ProtectedApi/functions/productionMachineDowntimes/handlers"
import {
    createMachineDowntimeValidator,
    deleteMachineDowntimeResponseValidator,
    deleteMachineDowntimeValidator,
    listMachineDowntimesResponseValidator,
    listMachineDowntimesValidator,
    machineDowntimeResponseValidator,
    updateMachineDowntimeValidator,
} from "@/functions/ProtectedApi/validators/productionMachineDowntimes"
import { PRODUCTION_PLANNER_GROUPS } from "@/functions/shared/production/access"
import { withProductionChange } from "@/functions/shared/production/realtime"
import type {
    ICreateMachineDowntimeEvent,
    IDeleteMachineDowntimeEvent,
    IListMachineDowntimesEvent,
    IUpdateMachineDowntimeEvent,
} from "@/functions/ProtectedApi/types/productionMachineDowntimes"

const deps = () => ({
    productionMachineDowntimeRepository: productionMachineDowntimeRepository(),
    productionMachineRepository: productionMachineRepository(),
})

export const listMachineDowntimes = lambdaHandler(
    async (event) => listMachineDowntimesHandler(deps())(event as IListMachineDowntimesEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: listMachineDowntimesValidator,
        responseValidator: listMachineDowntimesResponseValidator,
    },
)

export const createMachineDowntime = lambdaHandler(
    withProductionChange("definitions", async (event) => createMachineDowntimeHandler(deps())(event as ICreateMachineDowntimeEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: createMachineDowntimeValidator,
        responseValidator: machineDowntimeResponseValidator,
    },
)

export const updateMachineDowntime = lambdaHandler(
    withProductionChange("definitions", async (event) => updateMachineDowntimeHandler(deps())(event as IUpdateMachineDowntimeEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: updateMachineDowntimeValidator,
        responseValidator: machineDowntimeResponseValidator,
    },
)

export const deleteMachineDowntime = lambdaHandler(
    withProductionChange("definitions", async (event) => deleteMachineDowntimeHandler(deps())(event as IDeleteMachineDowntimeEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: deleteMachineDowntimeValidator,
        responseValidator: deleteMachineDowntimeResponseValidator,
    },
)
