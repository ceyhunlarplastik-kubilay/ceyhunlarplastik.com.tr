import type { ProductionMachineStatus } from "@/features/production/shared/machineStatus"

export type ProductionMachine = {
    id: string
    code: string
    name: string
    brand: string | null
    model: string | null
    serialNumber: string | null
    manufactureYear: number | null
    areaId: string
    area: { id: string; code: string; name: string }
    status: ProductionMachineStatus
    clampForceTon: number
    tieBarHorizontalMm: number | null
    tieBarVerticalMm: number | null
    minMoldHeightMm: number | null
    maxMoldHeightMm: number | null
    maxOpeningStrokeMm: number | null
    maxDaylightMm: number | null
    shotCapacityG: number | null
    screwDiameterMm: number | null
    locatingRingDiameterMm: number | null
    hotRunnerZones: number
    coreCircuits: number
    hasRobot: boolean
    plannedEfficiencyPercent: number
    hourlyCost: number | null
    currency: string
    shiftPatternId: string | null
    shiftPattern: { id: string; name: string } | null
    sortOrder: number
    notes: string | null
    createdAt: string
    updatedAt: string
}

export type ProductionMachineInput = Omit<
    ProductionMachine,
    "id" | "area" | "shiftPattern" | "currency" | "createdAt" | "updatedAt"
>
