import { prisma } from "@/core/db/prisma"
import { Prisma } from "@/prisma/generated/prisma/client"

const materialProfileSelect = {
    id: true,
    name: true,
    code: true,
    processProfile: {
        select: {
            isMoldResin: true,
            family: true,
            densityGCm3: true,
            requiresDrying: true,
            dryingTempC: true,
            dryingHours: true,
            cycleTimeFactor: true,
            purgeNote: true,
            updatedAt: true,
        },
    },
} satisfies Prisma.MaterialSelect

type MaterialProfileRecord = Prisma.MaterialGetPayload<{ select: typeof materialProfileSelect }>

/** Katalog hammaddesi + (varsa) üretim profili. Profil yoksa `profile: null`. */
export type MaterialWithProfileDto = Omit<MaterialProfileRecord, "processProfile"> & {
    profile: MaterialProfileRecord["processProfile"]
}

export type MaterialProfileWriteInput = {
    isMoldResin: boolean
    family: string | null
    densityGCm3: number | null
    requiresDrying: boolean
    dryingTempC: number | null
    dryingHours: number | null
    cycleTimeFactor: number
    purgeNote: string | null
}

function toDto({ processProfile, ...material }: MaterialProfileRecord): MaterialWithProfileDto {
    return { ...material, profile: processProfile }
}

export interface IPrismaProductionMaterialProfileRepository {
    listMaterialsWithProfiles(): Promise<MaterialWithProfileDto[]>
    getMaterialWithProfile(materialId: string): Promise<MaterialWithProfileDto | null>
    upsertProfile(materialId: string, input: MaterialProfileWriteInput): Promise<MaterialWithProfileDto>
}

export const productionMaterialProfileRepository = (): IPrismaProductionMaterialProfileRepository => {
    const listMaterialsWithProfiles = async () => {
        const records = await prisma.material.findMany({ orderBy: { name: "asc" }, select: materialProfileSelect })
        return records.map(toDto)
    }

    const getMaterialWithProfile = async (materialId: string) => {
        const record = await prisma.material.findUnique({ where: { id: materialId }, select: materialProfileSelect })
        return record ? toDto(record) : null
    }

    const upsertProfile = async (materialId: string, input: MaterialProfileWriteInput) => {
        await prisma.materialProcessProfile.upsert({
            where: { materialId },
            create: { materialId, ...input },
            update: input,
        })
        const material = await getMaterialWithProfile(materialId)
        if (!material) throw new Error(`Material ${materialId} disappeared after profile upsert`)
        return material
    }

    return { listMaterialsWithProfiles, getMaterialWithProfile, upsertProfile }
}
