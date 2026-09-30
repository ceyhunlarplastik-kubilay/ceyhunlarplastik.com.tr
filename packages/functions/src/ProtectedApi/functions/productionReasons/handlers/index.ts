import createError from "http-errors"

import {
    findReasonIssues,
    missingDefaultReasons,
    normalizeReasonCode,
    REASON_KIND_LABELS,
    type ProductionReasonKind,
} from "@/core/helpers/production/productionReasons"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type {
    ICreateDefaultProductionReasonsEvent,
    ICreateProductionReasonEvent,
    IDeleteProductionReasonEvent,
    IListProductionReasonsEvent,
    IProductionReasonDependencies,
    IUpdateProductionReasonEvent,
} from "@/functions/ProtectedApi/types/productionReasons"

async function assertCodeFree(deps: IProductionReasonDependencies, kind: ProductionReasonKind, code: string, excludeId?: string) {
    if (await deps.productionReasonRepository.codeTaken(kind, code, excludeId)) {
        throw new createError.Conflict(`${code} kodlu bir ${REASON_KIND_LABELS[kind].toLocaleLowerCase("tr-TR")} nedeni zaten var.`)
    }
}

function assertValid(input: Parameters<typeof findReasonIssues>[0]) {
    const issues = findReasonIssues(input)
    if (issues.length > 0) throw new createError.BadRequest(issues.map((issue) => issue.message).join(" "))
}

export const listProductionReasonsHandler = (deps: IProductionReasonDependencies) => {
    return async (_event: IListProductionReasonsEvent) => {
        const reasons = await deps.productionReasonRepository.listReasons()
        return apiResponseDTO({ statusCode: 200, payload: { reasons } })
    }
}

export const createProductionReasonHandler = (deps: IProductionReasonDependencies) => {
    return async (event: ICreateProductionReasonEvent) => {
        const { kind, name, isActive, sortOrder } = event.body
        const code = normalizeReasonCode(event.body.code)
        const stopCategory = event.body.stopCategory ?? null
        assertValid({ kind, code, name, stopCategory })
        await assertCodeFree(deps, kind, code)

        const reason = await deps.productionReasonRepository.createReason({
            kind,
            code,
            name: name.trim(),
            stopCategory,
            isActive: isActive ?? true,
            sortOrder: sortOrder ?? 0,
        })
        return apiResponseDTO({ statusCode: 201, payload: { reason } })
    }
}

export const updateProductionReasonHandler = (deps: IProductionReasonDependencies) => {
    return async (event: IUpdateProductionReasonEvent) => {
        const existing = await deps.productionReasonRepository.getReason(event.pathParameters.id)
        if (!existing) throw new createError.NotFound("Neden bulunamadı.")

        const code = event.body.code === undefined ? existing.code : normalizeReasonCode(event.body.code)
        const name = event.body.name === undefined ? existing.name : event.body.name.trim()
        const stopCategory = event.body.stopCategory === undefined ? existing.stopCategory : event.body.stopCategory
        assertValid({ kind: existing.kind, code, name, stopCategory })
        if (code !== existing.code) await assertCodeFree(deps, existing.kind, code, existing.id)

        const reason = await deps.productionReasonRepository.updateReason(existing.id, {
            code,
            name,
            stopCategory,
            ...(event.body.isActive === undefined ? {} : { isActive: event.body.isActive }),
            ...(event.body.sortOrder === undefined ? {} : { sortOrder: event.body.sortOrder }),
        })
        return apiResponseDTO({ statusCode: 200, payload: { reason } })
    }
}

/** Raporda kullanılan neden silinmez (Restrict) — pasife alınır. */
export const deleteProductionReasonHandler = (deps: IProductionReasonDependencies) => {
    return async (event: IDeleteProductionReasonEvent) => {
        const existing = await deps.productionReasonRepository.getReason(event.pathParameters.id)
        if (!existing) throw new createError.NotFound("Neden bulunamadı.")
        if (existing.usageCount > 0) {
            throw new createError.Conflict(`${existing.code} · ${existing.name} ${existing.usageCount} kayıtta kullanılıyor; silmek yerine pasife alın.`)
        }
        await deps.productionReasonRepository.deleteReason(existing.id)
        return apiResponseDTO({ statusCode: 200, payload: { id: existing.id } })
    }
}

/** "Varsayılanları ekle": sözlükte (tür + kod) olmayan varsayılanlar eklenir; var olana dokunulmaz. */
export const createDefaultProductionReasonsHandler = (deps: IProductionReasonDependencies) => {
    return async (_event: ICreateDefaultProductionReasonsEvent) => {
        const existing = await deps.productionReasonRepository.listReasons()
        const missing = missingDefaultReasons(existing)
        const created = missing.length > 0
            ? await deps.productionReasonRepository.createMany(missing.map((reason) => ({ ...reason, isActive: true })))
            : 0
        return apiResponseDTO({ statusCode: 201, payload: { created } })
    }
}
