import createError from "http-errors"

import {
    enumerateDateKeys,
    findCalendarExceptionIssues,
    formatDateKeyList,
} from "@/core/helpers/production/productionCalendar"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { optionalText } from "@/functions/shared/production/input"
import type {
    IBulkDeleteCalendarExceptionsEvent,
    IListCalendarExceptionsEvent,
    IProductionCalendarExceptionDependencies,
    ISaveCalendarExceptionEntryEvent,
} from "@/functions/ProtectedApi/types/productionCalendarExceptions"

export const listCalendarExceptionsHandler = ({
    productionCalendarExceptionRepository,
}: IProductionCalendarExceptionDependencies) => {
    return async (event: IListCalendarExceptionsEvent) => {
        const { from, to } = event.queryStringParameters ?? {}
        const exceptions = await productionCalendarExceptionRepository.listExceptions({ from, to })
        return apiResponseDTO({ statusCode: 200, payload: { exceptions } })
    }
}

/**
 * Takvim kaydı oluşturur ya da (`replaceIds` doluysa) düzenler: aralık günlere açılır,
 * aynı kapsamda zaten kaydı olan gün varsa 409. Düzenlenen kaydın kendi günleri
 * çakışma sayılmaz; silme + yazma tek transaction'dadır.
 */
export const saveCalendarExceptionEntryHandler = (deps: IProductionCalendarExceptionDependencies) => {
    return async (event: ISaveCalendarExceptionEntryEvent) => {
        const body = event.body
        const areaId = body.areaId ?? null
        const machineId = body.machineId ?? null
        const endDate = body.endDate || body.startDate

        const issues = findCalendarExceptionIssues({ startDate: body.startDate, endDate, areaId, machineId })
        if (issues.length > 0) throw new createError.BadRequest(issues.map((issue) => issue.message).join(" "))

        if (areaId && !(await deps.productionAreaRepository.getArea(areaId))) {
            throw new createError.NotFound("Alan bulunamadı.")
        }
        if (machineId && !(await deps.productionMachineRepository.getMachine(machineId))) {
            throw new createError.NotFound("Makine bulunamadı.")
        }

        const replaceIds = [...new Set(body.replaceIds ?? [])]
        if (replaceIds.length > 0) {
            const existing = await deps.productionCalendarExceptionRepository.findExistingIds(replaceIds)
            if (existing.size !== replaceIds.length) {
                throw new createError.NotFound("Düzenlenen takvim kaydı bulunamadı; sayfayı yenileyip tekrar deneyin.")
            }
        }

        const dates = enumerateDateKeys(body.startDate, endDate)
        const conflicts = await deps.productionCalendarExceptionRepository.findConflictingDateKeys({
            dates,
            areaId,
            machineId,
            excludeIds: replaceIds,
        })
        if (conflicts.length > 0) {
            throw new createError.Conflict(
                `Bu kapsamda şu günler için zaten kayıt var: ${formatDateKeyList(conflicts)}. Önce o kaydı düzenleyin ya da silin.`,
            )
        }

        const exceptions = await deps.productionCalendarExceptionRepository.replaceEntry({
            removeIds: replaceIds,
            dates,
            kind: body.kind,
            note: optionalText(body.note) ?? null,
            areaId,
            machineId,
        })
        return apiResponseDTO({ statusCode: replaceIds.length > 0 ? 200 : 201, payload: { exceptions } })
    }
}

export const bulkDeleteCalendarExceptionsHandler = ({
    productionCalendarExceptionRepository,
}: IProductionCalendarExceptionDependencies) => {
    return async (event: IBulkDeleteCalendarExceptionsEvent) => {
        const ids = [...new Set(event.body.ids)]
        const deletedCount = await productionCalendarExceptionRepository.deleteExceptions(ids)
        if (deletedCount === 0) throw new createError.NotFound("Silinecek takvim kaydı bulunamadı.")
        return apiResponseDTO({ statusCode: 200, payload: { deletedCount } })
    }
}
