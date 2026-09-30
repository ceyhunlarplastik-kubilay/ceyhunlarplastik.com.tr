export type MaterialProcessProfile = {
    isMoldResin: boolean
    family: string | null
    densityGCm3: number | null
    requiresDrying: boolean
    dryingTempC: number | null
    dryingHours: number | null
    cycleTimeFactor: number
    purgeNote: string | null
    updatedAt: string
}

export type MaterialWithProfile = {
    id: string
    name: string
    code: string | null
    profile: MaterialProcessProfile | null
}

export type MaterialProfileInput = Omit<MaterialProcessProfile, "updatedAt">
