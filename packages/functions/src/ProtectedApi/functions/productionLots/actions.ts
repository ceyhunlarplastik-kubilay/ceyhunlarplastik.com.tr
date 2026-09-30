import { lambdaHandler } from "@/core/middy"
import { productionLotRepository } from "@/core/helpers/prisma/productionLots/repository"
import { productionOperatorRepository } from "@/core/helpers/prisma/productionOperators/repository"
import { productionReasonRepository } from "@/core/helpers/prisma/productionReasons/repository"
import { productionShiftAssignmentRepository } from "@/core/helpers/prisma/productionShiftAssignments/repository"
import {
    createProductionLotNoteHandler,
    deleteProductionLotNoteHandler,
    getProductionLotHandler,
    listProductionLotsHandler,
    replaceProductionLotOperatorsHandler,
    reportProductionLotHandler,
    startProductionLotHandler,
} from "@/functions/ProtectedApi/functions/productionLots/handlers"
import {
    createProductionLotNoteValidator,
    deleteProductionLotNoteResponseValidator,
    deleteProductionLotNoteValidator,
    getProductionLotValidator,
    listProductionLotsResponseValidator,
    listProductionLotsValidator,
    productionLotNoteResponseValidator,
    productionLotResponseValidator,
    replaceProductionLotOperatorsResponseValidator,
    replaceProductionLotOperatorsValidator,
    reportProductionLotResponseValidator,
    reportProductionLotValidator,
    startProductionLotResponseValidator,
    startProductionLotValidator,
} from "@/functions/ProtectedApi/validators/productionLots"
import { PRODUCTION_PLANNER_GROUPS } from "@/functions/shared/production/access"
import { withProductionChange } from "@/functions/shared/production/realtime"
import type {
    ICreateProductionLotNoteEvent,
    IDeleteProductionLotNoteEvent,
    IGetProductionLotEvent,
    IListProductionLotsEvent,
    IReplaceProductionLotOperatorsEvent,
    IReportProductionLotEvent,
    IStartProductionLotEvent,
} from "@/functions/ProtectedApi/types/productionLots"

const deps = () => ({
    productionLotRepository: productionLotRepository(),
    productionShiftAssignmentRepository: productionShiftAssignmentRepository(),
    productionOperatorRepository: productionOperatorRepository(),
    productionReasonRepository: productionReasonRepository(),
})

export const listProductionLots = lambdaHandler(
    async (event) => listProductionLotsHandler(deps())(event as IListProductionLotsEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: listProductionLotsValidator,
        responseValidator: listProductionLotsResponseValidator,
    },
)

export const getProductionLot = lambdaHandler(
    async (event) => getProductionLotHandler(deps())(event as IGetProductionLotEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: getProductionLotValidator,
        responseValidator: productionLotResponseValidator,
    },
)

export const replaceProductionLotOperators = lambdaHandler(
    withProductionChange("lots", async (event) => replaceProductionLotOperatorsHandler(deps())(event as IReplaceProductionLotOperatorsEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: replaceProductionLotOperatorsValidator,
        responseValidator: replaceProductionLotOperatorsResponseValidator,
    },
)

export const createProductionLotNote = lambdaHandler(
    withProductionChange("lots", async (event) => createProductionLotNoteHandler(deps())(event as ICreateProductionLotNoteEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: createProductionLotNoteValidator,
        responseValidator: productionLotNoteResponseValidator,
    },
)

export const deleteProductionLotNote = lambdaHandler(
    withProductionChange("lots", async (event) => deleteProductionLotNoteHandler(deps())(event as IDeleteProductionLotNoteEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: deleteProductionLotNoteValidator,
        responseValidator: deleteProductionLotNoteResponseValidator,
    },
)

/** Lotu başlatır (anlık izleme; iş Üretimde'ye geçer). */
export const startProductionLot = lambdaHandler(
    withProductionChange("plan", async (event) => startProductionLotHandler(deps())(event as IStartProductionLotEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: startProductionLotValidator,
        responseValidator: startProductionLotResponseValidator,
    },
)

/** Vardiya raporu — lotu kapatır, sıradaki lotu başlatır, kalıp sayacını artırır. */
export const reportProductionLot = lambdaHandler(
    withProductionChange("plan", async (event) => reportProductionLotHandler(deps())(event as IReportProductionLotEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: reportProductionLotValidator,
        responseValidator: reportProductionLotResponseValidator,
    },
)
