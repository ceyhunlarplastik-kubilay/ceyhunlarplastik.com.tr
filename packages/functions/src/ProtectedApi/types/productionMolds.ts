import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { IPrismaProductionMachineRepository } from "@/core/helpers/prisma/productionMachines/repository"
import type { IPrismaProductionMoldRepository } from "@/core/helpers/prisma/productionMolds/repository"
import type { IPrismaProductionReferenceRepository } from "@/core/helpers/prisma/productionReferences/repository"
import type { MoldOwnership, MoldStatus } from "@/prisma/generated/prisma/client"

export interface IProductionMoldDependencies {
    productionMoldRepository: IPrismaProductionMoldRepository
    productionReferenceRepository: IPrismaProductionReferenceRepository
    productionMachineRepository: IPrismaProductionMachineRepository
}

export type IMoldOutputBody = {
    productSizeId: string
    cavities: number
    partWeightG?: number | null
}

export type IMoldMachineProfileBody = {
    machineId: string
    cycleTimeSec?: number | null
    setupMinutes?: number | null
    isPreferred?: boolean
    isBlocked?: boolean
    notes?: string | null
}

export type IMoldBody = {
    code: string
    name: string
    status?: MoldStatus
    ownership?: MoldOwnership
    requiredClampForceTon?: number | null
    widthMm?: number | null
    heightMm?: number | null
    thicknessMm?: number | null
    weightKg?: number | null
    requiredOpeningStrokeMm?: number | null
    locatingRingDiameterMm?: number | null
    hotRunnerZones?: number
    coreCircuitsRequired?: number
    requiresRobot?: boolean
    standardCycleTimeSec: number
    runnerWeightG?: number | null
    expectedScrapPercent?: number
    setupMinutes?: number
    totalShots?: number
    maintenanceIntervalShots?: number | null
    shotsAtLastMaintenance?: number
    lastMaintenanceAt?: string | null
    storageLocation?: string | null
    notes?: string | null
    /** Verilirse TAM değişim (PATCH'te gönderilmezse mevcut satırlara dokunulmaz). */
    outputs?: IMoldOutputBody[]
    machineProfiles?: IMoldMachineProfileBody[]
}

export type IListMoldsEvent = IAPIGatewayProxyEventWithUserGeneric

export type IGetMoldEvent = IAPIGatewayProxyEventWithUserGeneric<unknown, { id: string }>

export type ICreateMoldEvent = IAPIGatewayProxyEventWithUserGeneric<IMoldBody>

export type IUpdateMoldEvent = IAPIGatewayProxyEventWithUserGeneric<Partial<IMoldBody>, { id: string }>

export type IDeleteMoldEvent = IGetMoldEvent

/** "Bakım yapıldı" — `performedAt` verilmezse şimdi. */
export type IRecordMoldMaintenanceEvent = IAPIGatewayProxyEventWithUserGeneric<{ performedAt?: string }, { id: string }>

/** Gerçekleşen çevrim önerisini makine kartına yazar (5.3). */
export type ISetMoldMachineCycleEvent = IAPIGatewayProxyEventWithUserGeneric<{ cycleTimeSec: number }, { id: string; machineId: string }>
