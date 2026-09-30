import createError from "http-errors"

import type { ShiftPatternWriteInput } from "@/core/helpers/prisma/productionShiftPatterns/repository"
import { isPrismaErrorCode } from "@/core/helpers/prisma/errors"
import { findShiftPatternIssues, normalizeShiftDefinitions } from "@/core/helpers/production/shiftPatterns"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { optionalText, requireText } from "@/functions/shared/production/input"
import type {
    ICreateShiftPatternEvent,
    IDeleteShiftPatternEvent,
    IListShiftPatternsEvent,
    IProductionShiftPatternDependencies,
    IReplaceShiftPatternEvent,
    IShiftPatternBody,
} from "@/functions/ProtectedApi/types/productionShiftPatterns"

/**
 * Düzen kuralları (örtüşme, 24 saati aşma, tekrarlanan kod) core `findShiftPatternIssues`
 * ile denetlenir — frontend formu da aynı fonksiyonu gösteriyor.
 */
function prepareShiftPattern(body: IShiftPatternBody, isDefault: boolean): ShiftPatternWriteInput {
    const shifts = normalizeShiftDefinitions(body.shifts)
    const issues = findShiftPatternIssues(shifts)
    if (issues.length > 0) {
        throw new createError.BadRequest(issues.map((issue) => issue.message).join(" "))
    }

    return {
        name: requireText(body.name, "Düzen adı"),
        isDefault,
        notes: optionalText(body.notes) ?? null,
        shifts,
    }
}

function conflictOnDuplicateName(error: unknown): never {
    if (isPrismaErrorCode(error, "P2002")) {
        throw new createError.Conflict("Bu adla bir vardiya düzeni zaten var.")
    }
    throw error
}

export const listShiftPatternsHandler = ({ productionShiftPatternRepository }: IProductionShiftPatternDependencies) => {
    return async (_event: IListShiftPatternsEvent) => {
        const shiftPatterns = await productionShiftPatternRepository.listShiftPatterns()
        return apiResponseDTO({ statusCode: 200, payload: { shiftPatterns } })
    }
}

export const createShiftPatternHandler = ({ productionShiftPatternRepository }: IProductionShiftPatternDependencies) => {
    return async (event: ICreateShiftPatternEvent) => {
        const input = prepareShiftPattern(event.body, event.body.isDefault ?? false)

        try {
            const shiftPattern = await productionShiftPatternRepository.createShiftPattern(input)
            return apiResponseDTO({ statusCode: 201, payload: { shiftPattern } })
        } catch (error) {
            conflictOnDuplicateName(error)
        }
    }
}

export const replaceShiftPatternHandler = ({ productionShiftPatternRepository }: IProductionShiftPatternDependencies) => {
    return async (event: IReplaceShiftPatternEvent) => {
        const { id } = event.pathParameters
        const existing = await productionShiftPatternRepository.getShiftPattern(id)
        if (!existing) throw new createError.NotFound("Vardiya düzeni bulunamadı.")

        // Varsayılansız kalınmasın: varsayılanlık yalnız başka bir düzen varsayılan
        // yapılarak devredilir (o düzenin kaydı bunu kendiliğinden kaldırır).
        if (existing.isDefault && event.body.isDefault === false) {
            throw new createError.BadRequest(
                "Varsayılan düzeni kaldırmak için başka bir düzeni varsayılan yapın.",
            )
        }

        const input = prepareShiftPattern(event.body, event.body.isDefault ?? existing.isDefault)

        try {
            const shiftPattern = await productionShiftPatternRepository.replaceShiftPattern(id, input)
            return apiResponseDTO({ statusCode: 200, payload: { shiftPattern } })
        } catch (error) {
            conflictOnDuplicateName(error)
        }
    }
}

export const deleteShiftPatternHandler = ({ productionShiftPatternRepository }: IProductionShiftPatternDependencies) => {
    return async (event: IDeleteShiftPatternEvent) => {
        const { id } = event.pathParameters
        const existing = await productionShiftPatternRepository.getShiftPattern(id)
        if (!existing) throw new createError.NotFound("Vardiya düzeni bulunamadı.")

        // Düzen seçmemiş makineler varsayılana düşer; varsayılan silinirse takvimsiz kalırlar.
        if (existing.isDefault) {
            throw new createError.Conflict(
                "Varsayılan vardiya düzeni silinemez; önce başka bir düzeni varsayılan yapın.",
            )
        }

        // Şemada SetNull var ama sessizce varsayılana düşürmek planı fark ettirmeden değiştirir.
        const usage = existing.machineCount + existing.areaCount
        if (usage > 0) {
            throw new createError.Conflict(
                `Bu düzen ${existing.machineCount} makine ve ${existing.areaCount} alanda kullanılıyor; önce onlardan kaldırın.`,
            )
        }

        await productionShiftPatternRepository.deleteShiftPattern(id)
        return apiResponseDTO({ statusCode: 200, payload: { id } })
    }
}
