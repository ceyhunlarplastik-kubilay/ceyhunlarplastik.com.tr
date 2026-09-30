import createError from "http-errors"

import { normalizeProductionCode } from "@/core/helpers/production/productionMasterData"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { optionalText } from "@/functions/shared/production/input"
import type {
    IListMaterialProfilesEvent,
    IProductionMaterialProfileDependencies,
    IUpsertMaterialProfileEvent,
} from "@/functions/ProtectedApi/types/productionMaterialProfiles"

export const listMaterialProfilesHandler = ({ productionMaterialProfileRepository }: IProductionMaterialProfileDependencies) => {
    return async (_event: IListMaterialProfilesEvent) => {
        const materials = await productionMaterialProfileRepository.listMaterialsWithProfiles()
        return apiResponseDTO({ statusCode: 200, payload: { materials } })
    }
}

export const upsertMaterialProfileHandler = ({ productionMaterialProfileRepository }: IProductionMaterialProfileDependencies) => {
    return async (event: IUpsertMaterialProfileEvent) => {
        const { materialId } = event.pathParameters
        const body = event.body

        const existing = await productionMaterialProfileRepository.getMaterialWithProfile(materialId)
        if (!existing) throw new createError.NotFound("Hammadde bulunamadı.")

        const family = optionalText(body.family)
        const material = await productionMaterialProfileRepository.upsertProfile(materialId, {
            isMoldResin: body.isMoldResin,
            family: family ? normalizeProductionCode(family) : null,
            densityGCm3: body.densityGCm3 ?? null,
            requiresDrying: body.requiresDrying,
            // Kurutma gerekmiyorsa eski değerler taşınmasın — planlama onları okur.
            dryingTempC: body.requiresDrying ? body.dryingTempC ?? null : null,
            dryingHours: body.requiresDrying ? body.dryingHours ?? null : null,
            cycleTimeFactor: body.cycleTimeFactor,
            purgeNote: optionalText(body.purgeNote) ?? null,
        })

        return apiResponseDTO({ statusCode: 200, payload: { material } })
    }
}
