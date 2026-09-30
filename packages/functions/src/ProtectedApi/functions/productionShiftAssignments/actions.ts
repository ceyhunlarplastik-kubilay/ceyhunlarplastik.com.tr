import { lambdaHandler } from "@/core/middy"
import { productionAreaRepository } from "@/core/helpers/prisma/productionAreas/repository"
import { productionCalendarExceptionRepository } from "@/core/helpers/prisma/productionCalendarExceptions/repository"
import { productionMachineRepository } from "@/core/helpers/prisma/productionMachines/repository"
import { productionOperatorRepository } from "@/core/helpers/prisma/productionOperators/repository"
import { productionShiftAssignmentRepository } from "@/core/helpers/prisma/productionShiftAssignments/repository"
import { productionShiftPatternRepository } from "@/core/helpers/prisma/productionShiftPatterns/repository"
import {
    copyShiftAssignmentsHandler,
    getShiftAssignmentsHandler,
    replaceShiftAssignmentHandler,
} from "@/functions/ProtectedApi/functions/productionShiftAssignments/handlers"
import {
    copyShiftAssignmentsResponseValidator,
    copyShiftAssignmentsValidator,
    getShiftAssignmentsValidator,
    replaceShiftAssignmentResponseValidator,
    replaceShiftAssignmentValidator,
    shiftAssignmentsResponseValidator,
} from "@/functions/ProtectedApi/validators/productionShiftAssignments"
import { PRODUCTION_PLANNER_GROUPS } from "@/functions/shared/production/access"
import { withProductionChange } from "@/functions/shared/production/realtime"
import type {
    ICopyShiftAssignmentsEvent,
    IGetShiftAssignmentsEvent,
    IReplaceShiftAssignmentEvent,
} from "@/functions/ProtectedApi/types/productionShiftAssignments"

const deps = () => ({
    productionShiftAssignmentRepository: productionShiftAssignmentRepository(),
    productionMachineRepository: productionMachineRepository(),
    productionAreaRepository: productionAreaRepository(),
    productionShiftPatternRepository: productionShiftPatternRepository(),
    productionCalendarExceptionRepository: productionCalendarExceptionRepository(),
    productionOperatorRepository: productionOperatorRepository(),
})

export const getShiftAssignments = lambdaHandler(
    async (event) => getShiftAssignmentsHandler(deps())(event as IGetShiftAssignmentsEvent),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: getShiftAssignmentsValidator,
        responseValidator: shiftAssignmentsResponseValidator,
    },
)

export const replaceShiftAssignment = lambdaHandler(
    withProductionChange("roster", async (event) => replaceShiftAssignmentHandler(deps())(event as IReplaceShiftAssignmentEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: replaceShiftAssignmentValidator,
        responseValidator: replaceShiftAssignmentResponseValidator,
    },
)

export const copyShiftAssignments = lambdaHandler(
    withProductionChange("roster", async (event) => copyShiftAssignmentsHandler(deps())(event as ICopyShiftAssignmentsEvent)),
    {
        auth: { requiredPermissionGroups: PRODUCTION_PLANNER_GROUPS },
        requestValidator: copyShiftAssignmentsValidator,
        responseValidator: copyShiftAssignmentsResponseValidator,
    },
)
