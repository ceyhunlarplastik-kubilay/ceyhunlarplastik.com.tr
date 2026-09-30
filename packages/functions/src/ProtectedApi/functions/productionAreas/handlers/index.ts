import createError from "http-errors"

import { isPrismaErrorCode } from "@/core/helpers/prisma/errors"
import { normalizeProductionCode } from "@/core/helpers/production/productionMasterData"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { optionalText, requireText, withoutUndefined } from "@/functions/shared/production/input"
import type {
    ICreateProductionAreaEvent,
    IDeleteProductionAreaEvent,
    IListProductionAreasEvent,
    IProductionAreaDependencies,
    IUpdateProductionAreaEvent,
} from "@/functions/ProtectedApi/types/productionAreas"

async function assertShiftPatternExists(deps: IProductionAreaDependencies, shiftPatternId?: string | null) {
    if (!shiftPatternId) return
    const pattern = await deps.productionShiftPatternRepository.getShiftPattern(shiftPatternId)
    if (!pattern) throw new createError.NotFound("Vardiya düzeni bulunamadı.")
}

function conflictOnDuplicateCode(error: unknown, code: string): never {
    if (isPrismaErrorCode(error, "P2002")) {
        throw new createError.Conflict(`"${code}" koduyla bir alan zaten var.`)
    }
    throw error
}

export const listProductionAreasHandler = ({ productionAreaRepository }: IProductionAreaDependencies) => {
    return async (_event: IListProductionAreasEvent) => {
        const areas = await productionAreaRepository.listAreas()
        return apiResponseDTO({ statusCode: 200, payload: { areas } })
    }
}

export const createProductionAreaHandler = (deps: IProductionAreaDependencies) => {
    return async (event: ICreateProductionAreaEvent) => {
        const body = event.body
        const code = normalizeProductionCode(requireText(body.code, "Kod"))
        await assertShiftPatternExists(deps, body.shiftPatternId)

        try {
            const area = await deps.productionAreaRepository.createArea({
                code,
                name: requireText(body.name, "Ad"),
                // Varsayılanlar şemada değil burada (ajv union altındaki default'u uygulayamıyor).
                sortOrder: body.sortOrder ?? 0,
                isActive: body.isActive ?? true,
                notes: optionalText(body.notes) ?? null,
                shiftPatternId: body.shiftPatternId ?? null,
            })
            return apiResponseDTO({ statusCode: 201, payload: { area } })
        } catch (error) {
            conflictOnDuplicateCode(error, code)
        }
    }
}

export const updateProductionAreaHandler = (deps: IProductionAreaDependencies) => {
    return async (event: IUpdateProductionAreaEvent) => {
        const { id } = event.pathParameters
        const body = event.body

        const existing = await deps.productionAreaRepository.getArea(id)
        if (!existing) throw new createError.NotFound("Alan bulunamadı.")

        await assertShiftPatternExists(deps, body.shiftPatternId)
        const code = body.code === undefined ? undefined : normalizeProductionCode(requireText(body.code, "Kod"))

        try {
            const area = await deps.productionAreaRepository.updateArea(id, withoutUndefined({
                code,
                name: body.name === undefined ? undefined : requireText(body.name, "Ad"),
                sortOrder: body.sortOrder,
                isActive: body.isActive,
                notes: optionalText(body.notes),
                shiftPatternId: body.shiftPatternId,
            }))
            return apiResponseDTO({ statusCode: 200, payload: { area } })
        } catch (error) {
            conflictOnDuplicateCode(error, code ?? existing.code)
        }
    }
}

export const deleteProductionAreaHandler = ({ productionAreaRepository }: IProductionAreaDependencies) => {
    return async (event: IDeleteProductionAreaEvent) => {
        const { id } = event.pathParameters

        const existing = await productionAreaRepository.getArea(id)
        if (!existing) throw new createError.NotFound("Alan bulunamadı.")

        // Makine → alan `Restrict`: silme denenseydi FK hatası 500'e düşerdi.
        if (existing.machineCount > 0) {
            throw new createError.Conflict(
                `Bu alanda ${existing.machineCount} makine var; önce makineleri başka bir alana taşıyın.`,
            )
        }

        await productionAreaRepository.deleteArea(id)
        return apiResponseDTO({ statusCode: 200, payload: { id } })
    }
}
