import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { IPrismaProductionMaterialProfileRepository } from "@/core/helpers/prisma/productionMaterialProfiles/repository"

export interface IProductionMaterialProfileDependencies {
    productionMaterialProfileRepository: IPrismaProductionMaterialProfileRepository
}

export type IMaterialProfileBody = {
    isMoldResin: boolean
    family?: string | null
    densityGCm3?: number | null
    requiresDrying: boolean
    dryingTempC?: number | null
    dryingHours?: number | null
    cycleTimeFactor: number
    purgeNote?: string | null
}

export type IListMaterialProfilesEvent = IAPIGatewayProxyEventWithUserGeneric

/** Tam değişim (PUT): profil yoksa oluşturulur. */
export type IUpsertMaterialProfileEvent = IAPIGatewayProxyEventWithUserGeneric<IMaterialProfileBody, { materialId: string }>
