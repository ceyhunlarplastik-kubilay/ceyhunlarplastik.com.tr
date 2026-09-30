import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { IPrismaProductionAreaRepository } from "@/core/helpers/prisma/productionAreas/repository"
import type { IPrismaProductionMachineRepository } from "@/core/helpers/prisma/productionMachines/repository"
import type { IPrismaProductionShiftPatternRepository } from "@/core/helpers/prisma/productionShiftPatterns/repository"
import type { ProductionMachineStatus } from "@/prisma/generated/prisma/client"

export interface IProductionMachineDependencies {
    productionMachineRepository: IPrismaProductionMachineRepository
    productionAreaRepository: IPrismaProductionAreaRepository
    productionShiftPatternRepository: IPrismaProductionShiftPatternRepository
}

export type IProductionMachineBody = {
    code: string
    name: string
    brand?: string | null
    model?: string | null
    serialNumber?: string | null
    manufactureYear?: number | null
    areaId: string
    status?: ProductionMachineStatus
    clampForceTon: number
    tieBarHorizontalMm?: number | null
    tieBarVerticalMm?: number | null
    minMoldHeightMm?: number | null
    maxMoldHeightMm?: number | null
    maxOpeningStrokeMm?: number | null
    maxDaylightMm?: number | null
    shotCapacityG?: number | null
    screwDiameterMm?: number | null
    locatingRingDiameterMm?: number | null
    hotRunnerZones?: number
    coreCircuits?: number
    hasRobot?: boolean
    plannedEfficiencyPercent?: number
    hourlyCost?: number | null
    shiftPatternId?: string | null
    sortOrder?: number
    notes?: string | null
}

export type IListProductionMachinesEvent = IAPIGatewayProxyEventWithUserGeneric

export type IGetProductionMachineEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, { id: string }>

export type ICreateProductionMachineEvent = IAPIGatewayProxyEventWithUserGeneric<IProductionMachineBody>

export type IUpdateProductionMachineEvent = IAPIGatewayProxyEventWithUserGeneric<
    Partial<IProductionMachineBody>,
    { id: string }
>

export type IDeleteProductionMachineEvent = IGetProductionMachineEvent
