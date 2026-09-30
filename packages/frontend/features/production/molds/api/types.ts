import type { MoldOwnership, MoldStatus } from "@/features/production/shared/moldStatus"

export type MoldOutput = {
    id: string
    productSizeId: string
    cavities: number
    partWeightG: number | null
    product: { id: string; code: string; name: string }
    size: { id: string; code: number; sizeCode: string; label: string }
}

export type MoldMachineProfile = {
    id: string
    machineId: string
    cycleTimeSec: number | null
    setupMinutes: number | null
    isPreferred: boolean
    isBlocked: boolean
    notes: string | null
    machine: { id: string; code: string; name: string }
}

export type Mold = {
    id: string
    code: string
    name: string
    status: MoldStatus
    ownership: MoldOwnership
    ownerCustomerId: string | null
    requiredClampForceTon: number | null
    widthMm: number | null
    heightMm: number | null
    thicknessMm: number | null
    weightKg: number | null
    requiredOpeningStrokeMm: number | null
    locatingRingDiameterMm: number | null
    hotRunnerZones: number
    coreCircuitsRequired: number
    requiresRobot: boolean
    standardCycleTimeSec: number
    runnerWeightG: number | null
    expectedScrapPercent: number
    setupMinutes: number
    totalShots: number
    maintenanceIntervalShots: number | null
    shotsAtLastMaintenance: number
    lastMaintenanceAt: string | null
    storageLocation: string | null
    notes: string | null
    outputs: MoldOutput[]
    machineProfiles: MoldMachineProfile[]
    createdAt: string
    updatedAt: string
}

export type MoldInput = Omit<
    Mold,
    "id" | "ownerCustomerId" | "outputs" | "machineProfiles" | "createdAt" | "updatedAt"
> & {
    /** Tam değişim. */
    outputs: Array<Pick<MoldOutput, "productSizeId" | "cavities" | "partWeightG">>
    /** Tam değişim. */
    machineProfiles: Array<Omit<MoldMachineProfile, "id" | "machine">>
}
