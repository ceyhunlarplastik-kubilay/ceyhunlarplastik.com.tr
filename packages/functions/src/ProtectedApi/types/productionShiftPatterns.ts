import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { IPrismaProductionShiftPatternRepository } from "@/core/helpers/prisma/productionShiftPatterns/repository"
import type { ShiftDefinitionInput } from "@/core/helpers/production/shiftPatterns"

export interface IProductionShiftPatternDependencies {
    productionShiftPatternRepository: IPrismaProductionShiftPatternRepository
}

export type IShiftPatternBody = {
    name: string
    isDefault?: boolean
    notes?: string | null
    shifts: ShiftDefinitionInput[]
}

export type IListShiftPatternsEvent = IAPIGatewayProxyEventWithUserGeneric

export type ICreateShiftPatternEvent = IAPIGatewayProxyEventWithUserGeneric<IShiftPatternBody>

export type IReplaceShiftPatternEvent = IAPIGatewayProxyEventWithUserGeneric<IShiftPatternBody, { id: string }>

export type IDeleteShiftPatternEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, { id: string }>
