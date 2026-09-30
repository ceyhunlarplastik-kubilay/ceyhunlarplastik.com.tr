export type ShiftDefinition = {
    id: string
    code: string
    name: string
    startMinute: number
    durationMinutes: number
    daysOfWeek: number[]
    sortOrder: number
}

export type ShiftPattern = {
    id: string
    name: string
    isDefault: boolean
    timezone: string
    notes: string | null
    shifts: ShiftDefinition[]
    /** Düzeni doğrudan seçmiş makine / alan sayısı. */
    machineCount: number
    areaCount: number
    createdAt: string
    updatedAt: string
}

export type ShiftPatternInput = {
    name: string
    isDefault: boolean
    notes: string | null
    shifts: Array<Pick<ShiftDefinition, "code" | "name" | "startMinute" | "durationMinutes" | "daysOfWeek">>
}
