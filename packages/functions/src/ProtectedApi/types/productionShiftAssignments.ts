import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { IPrismaProductionAreaRepository } from "@/core/helpers/prisma/productionAreas/repository"
import type { IPrismaProductionCalendarExceptionRepository } from "@/core/helpers/prisma/productionCalendarExceptions/repository"
import type { IPrismaProductionMachineRepository } from "@/core/helpers/prisma/productionMachines/repository"
import type { IPrismaProductionOperatorRepository } from "@/core/helpers/prisma/productionOperators/repository"
import type { IPrismaShiftAssignmentRepository } from "@/core/helpers/prisma/productionShiftAssignments/repository"
import type { IPrismaProductionShiftPatternRepository } from "@/core/helpers/prisma/productionShiftPatterns/repository"

export interface IProductionShiftAssignmentDependencies {
    productionShiftAssignmentRepository: IPrismaShiftAssignmentRepository
    productionMachineRepository: IPrismaProductionMachineRepository
    productionAreaRepository: IPrismaProductionAreaRepository
    productionShiftPatternRepository: IPrismaProductionShiftPatternRepository
    productionCalendarExceptionRepository: IPrismaProductionCalendarExceptionRepository
    productionOperatorRepository: IPrismaProductionOperatorRepository
}

/** "YYYY-MM-DD" vardiya günü; verilmezse bugün (fabrika saati). */
export type IGetShiftAssignmentsEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, unknown, { date?: string } | undefined>

/** Hücrenin ekibini TAM değiştirir; boş liste hücreyi boşaltır. */
export type IReplaceShiftAssignmentBody = { machineId: string; shiftDate: string; shiftCode: string; operatorIds: string[] }

export type IReplaceShiftAssignmentEvent = IAPIGatewayProxyEventWithUserGeneric<IReplaceShiftAssignmentBody>

export type ICopyShiftAssignmentsEvent = IAPIGatewayProxyEventWithUserGeneric<{ fromDate: string; toStart: string; toEnd: string }>
