import { lambdaHandler } from "@/core/middy"
import { productionAreaRepository } from "@/core/helpers/prisma/productionAreas/repository"
import { productionCalendarExceptionRepository } from "@/core/helpers/prisma/productionCalendarExceptions/repository"
import { productionMachineRepository } from "@/core/helpers/prisma/productionMachines/repository"
import {
    bulkDeleteCalendarExceptionsHandler,
    listCalendarExceptionsHandler,
    saveCalendarExceptionEntryHandler,
} from "@/functions/ProtectedApi/functions/productionCalendarExceptions/handlers"
import {
    bulkDeleteCalendarExceptionsResponseValidator,
    bulkDeleteCalendarExceptionsValidator,
    listCalendarExceptionsResponseValidator,
    listCalendarExceptionsValidator,
    saveCalendarExceptionEntryValidator,
} from "@/functions/ProtectedApi/validators/productionCalendarExceptions"
import { PRODUCTION_PLANNER_GROUPS } from "@/functions/shared/production/access"
import { withProductionChange } from "@/functions/shared/production/realtime"
import type {
    IBulkDeleteCalendarExceptionsEvent,
    IListCalendarExceptionsEvent,
    ISaveCalendarExceptionEntryEvent,
} from "@/functions/ProtectedApi/types/productionCalendarExceptions"

const deps = () => ({
    productionCalendarExceptionRepository: productionCalendarExceptionRepository(),
    productionAreaRepository: productionAreaRepository(),
    productionMachineRepository: productionMachineRepository(),
})

export const listCalendarExceptions = lambdaHandler(
    async (event) => listCalendarExceptionsHandler(deps())(event as IListCalendarExceptionsEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: listCalendarExceptionsValidator,
        responseValidator: listCalendarExceptionsResponseValidator,
    },
)

/** Oluşturma ve düzenleme (`replaceIds`) aynı uç: ikisi de "bu günleri şu kayıtla yaz". */
export const saveCalendarExceptionEntry = lambdaHandler(
    withProductionChange("definitions", async (event) => saveCalendarExceptionEntryHandler(deps())(event as ISaveCalendarExceptionEntryEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: saveCalendarExceptionEntryValidator,
        responseValidator: listCalendarExceptionsResponseValidator,
    },
)

export const bulkDeleteCalendarExceptions = lambdaHandler(
    withProductionChange("definitions", async (event) => bulkDeleteCalendarExceptionsHandler(deps())(event as IBulkDeleteCalendarExceptionsEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: bulkDeleteCalendarExceptionsValidator,
        responseValidator: bulkDeleteCalendarExceptionsResponseValidator,
    },
)
