import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { IPrismaProductionVariantProfileRepository } from "@/core/helpers/prisma/productionVariantProfiles/repository"

export interface IProductionVariantProfileDependencies {
    productionVariantProfileRepository: IPrismaProductionVariantProfileRepository
}

export type IListProductionVariantsEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    {},
    { page?: string; limit?: string; q?: string }
>

/** Tam değişim (PUT): `cycleTimeSec: null` varyant çevrimini kaldırır. */
export type IUpsertProductionVariantProfileEvent = IAPIGatewayProxyEventWithUserGeneric<
    { cycleTimeSec: number | null },
    { variantId: string }
>
