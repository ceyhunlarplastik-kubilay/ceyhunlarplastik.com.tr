export type ProductionArea = {
    id: string
    code: string
    name: string
    sortOrder: number
    isActive: boolean
    notes: string | null
    shiftPatternId: string | null
    shiftPattern: { id: string; name: string } | null
    machineCount: number
    createdAt: string
    updatedAt: string
}

export type ProductionAreaInput = {
    code: string
    name: string
    sortOrder: number
    isActive: boolean
    notes: string | null
    shiftPatternId: string | null
}
