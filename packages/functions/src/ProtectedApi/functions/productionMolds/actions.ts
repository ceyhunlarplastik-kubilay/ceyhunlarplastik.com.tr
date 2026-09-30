import { lambdaHandler } from "@/core/middy"
import { productionMachineRepository } from "@/core/helpers/prisma/productionMachines/repository"
import { productionMoldRepository } from "@/core/helpers/prisma/productionMolds/repository"
import { productionReferenceRepository } from "@/core/helpers/prisma/productionReferences/repository"
import {
    createMoldHandler,
    deleteMoldHandler,
    getMoldHandler,
    listMoldsHandler,
    recordMoldMaintenanceHandler,
    setMoldMachineCycleHandler,
    updateMoldHandler,
} from "@/functions/ProtectedApi/functions/productionMolds/handlers"
import {
    createMoldValidator,
    deleteMoldResponseValidator,
    deleteMoldValidator,
    getMoldValidator,
    listMoldsResponseValidator,
    moldResponseValidator,
    recordMoldMaintenanceValidator,
    setMoldMachineCycleResponseValidator,
    setMoldMachineCycleValidator,
    updateMoldValidator,
} from "@/functions/ProtectedApi/validators/productionMolds"
import { PRODUCTION_PLANNER_GROUPS } from "@/functions/shared/production/access"
import { withProductionChange } from "@/functions/shared/production/realtime"
import type {
    ICreateMoldEvent,
    IDeleteMoldEvent,
    IGetMoldEvent,
    IListMoldsEvent,
    IRecordMoldMaintenanceEvent,
    ISetMoldMachineCycleEvent,
    IUpdateMoldEvent,
} from "@/functions/ProtectedApi/types/productionMolds"


const deps = () => ({
    productionMoldRepository: productionMoldRepository(),
    productionReferenceRepository: productionReferenceRepository(),
    productionMachineRepository: productionMachineRepository(),
})

export const listMolds = lambdaHandler(
    async (event) => listMoldsHandler(deps())(event as IListMoldsEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        responseValidator: listMoldsResponseValidator,
    },
)

export const getMold = lambdaHandler(
    async (event) => getMoldHandler(deps())(event as IGetMoldEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: getMoldValidator,
        responseValidator: moldResponseValidator,
    },
)

export const createMold = lambdaHandler(
    withProductionChange("definitions", async (event) => createMoldHandler(deps())(event as ICreateMoldEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: createMoldValidator,
        responseValidator: moldResponseValidator,
    },
)

export const updateMold = lambdaHandler(
    withProductionChange("definitions", async (event) => updateMoldHandler(deps())(event as IUpdateMoldEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: updateMoldValidator,
        responseValidator: moldResponseValidator,
    },
)

export const deleteMold = lambdaHandler(
    withProductionChange("definitions", async (event) => deleteMoldHandler(deps())(event as IDeleteMoldEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: deleteMoldValidator,
        responseValidator: deleteMoldResponseValidator,
    },
)

/** "Bakım yapıldı": son bakım sayacı = güncel sayaç. */
export const recordMoldMaintenance = lambdaHandler(
    withProductionChange("definitions", async (event) => recordMoldMaintenanceHandler(deps())(event as IRecordMoldMaintenanceEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: recordMoldMaintenanceValidator,
        responseValidator: moldResponseValidator,
    },
)

/** Gerçekleşen çevrim önerisini makine kartına yaz (5.3; kart yoksa oluşur). */
export const setMoldMachineCycle = lambdaHandler(
    withProductionChange("definitions", async (event) => setMoldMachineCycleHandler(deps())(event as ISetMoldMachineCycleEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: setMoldMachineCycleValidator,
        responseValidator: setMoldMachineCycleResponseValidator,
    },
)
