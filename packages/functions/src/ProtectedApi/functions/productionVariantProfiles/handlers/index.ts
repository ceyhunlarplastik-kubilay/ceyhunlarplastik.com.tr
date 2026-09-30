import createError from "http-errors"

import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type {
    IListProductionVariantsEvent,
    IProductionVariantProfileDependencies,
    IUpsertProductionVariantProfileEvent,
} from "@/functions/ProtectedApi/types/productionVariantProfiles"

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export const listProductionVariantsHandler = ({ productionVariantProfileRepository }: IProductionVariantProfileDependencies) => {
    return async (event: IListProductionVariantsEvent) => {
        const query = event.queryStringParameters ?? {}
        const page = Math.max(1, Number(query.page ?? 1))
        const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(query.limit ?? DEFAULT_PAGE_SIZE)))

        const result = await productionVariantProfileRepository.listVariants({ page, limit, search: query.q })
        return apiResponseDTO({ statusCode: 200, payload: result })
    }
}

export const upsertProductionVariantProfileHandler = ({ productionVariantProfileRepository }: IProductionVariantProfileDependencies) => {
    return async (event: IUpsertProductionVariantProfileEvent) => {
        const { variantId } = event.pathParameters

        // İç üretim olmayan varyant bu panelde YOKTUR: var olsa da 404 (katalog bilgisi sızdırılmaz).
        const existing = await productionVariantProfileRepository.getVariant(variantId)
        if (!existing) throw new createError.NotFound("Varyant bulunamadı ya da iç üretim tedarikçisine bağlı değil.")

        const variant = await productionVariantProfileRepository.setCycleTime(variantId, event.body.cycleTimeSec)
        return apiResponseDTO({ statusCode: 200, payload: { variant } })
    }
}
