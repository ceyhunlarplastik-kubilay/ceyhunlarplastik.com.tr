import createError from "http-errors"

import type { LotListItemDto, LotNoteDto } from "@/core/helpers/prisma/productionLots/repository"
import type { OperatorRefDto, ShiftAssignmentDto } from "@/core/helpers/prisma/productionShiftAssignments/repository"
import {
    deriveShots,
    findLotReportIssues,
    findLotStartIssue,
    jobStatusAfterLotStart,
    jobStatusAfterReport,
    nextLotToStart,
} from "@/core/helpers/production/lotReports"
import { addDaysToDateKey } from "@/core/helpers/production/productionCalendar"
import {
    canDeleteLotNote,
    findLotNoteIssue,
    formatLotNumber,
    MAX_OPERATORS_PER_LOT,
    resolveLotOperators,
} from "@/core/helpers/production/productionLots"
import { productionDateKey } from "@/core/helpers/production/productionTime"
import { findOperatorSelectionIssue } from "@/core/helpers/production/shiftAssignments"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type {
    ICreateProductionLotNoteEvent,
    IDeleteProductionLotNoteEvent,
    IGetProductionLotEvent,
    IListProductionLotsEvent,
    IProductionLotDependencies,
    IReplaceProductionLotOperatorsEvent,
    IReportProductionLotEvent,
    IStartProductionLotEvent,
} from "@/functions/ProtectedApi/types/productionLots"

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100
/** Tarih verilmezse liste bugün + bu kadar günü gösterir. */
const DEFAULT_WINDOW_DAYS = 7

type Viewer = { id: string | null | undefined; isAdmin: boolean; isOwner: boolean }

function viewerOf(event: { user?: { id?: string; isAdmin?: boolean; isOwner?: boolean } }): Viewer {
    return { id: event.user?.id, isAdmin: Boolean(event.user?.isAdmin), isOwner: Boolean(event.user?.isOwner) }
}

const cellKey = (machineId: string, shiftDate: string, shiftCode: string) => `${machineId}|${shiftDate}|${shiftCode}`

function groupRoster(assignments: ShiftAssignmentDto[]): Map<string, OperatorRefDto[]> {
    const map = new Map<string, OperatorRefDto[]>()
    for (const assignment of assignments) {
        const key = cellKey(assignment.machineId, assignment.shiftDate, assignment.shiftCode)
        map.set(key, [...(map.get(key) ?? []), assignment.operator])
    }
    return map
}

/** Lota özel ekip yoksa vardiya ekibinden türet (tek sorguda, sayfadaki tüm lotlar için). */
async function withOperators<T extends LotListItemDto>(deps: IProductionLotDependencies, lots: T[]) {
    const needRoster = lots.filter((lot) => lot.lotOperators.length === 0)
    const roster = groupRoster(await deps.productionShiftAssignmentRepository.listForCells(
        needRoster.map((lot) => ({ machineId: lot.job.machine.id, shiftDate: lot.shiftDate, shiftCode: lot.shiftCode })),
    ))
    return lots.map(({ lotOperators, ...lot }) => {
        const resolved = resolveLotOperators(lotOperators, roster.get(cellKey(lot.job.machine.id, lot.shiftDate, lot.shiftCode)) ?? [])
        return { ...lot, operators: { source: resolved.source, list: resolved.operators } }
    })
}

function withCanDelete(note: LotNoteDto, viewer: Viewer) {
    return { ...note, canDelete: canDeleteLotNote(note, viewer) }
}

export const listProductionLotsHandler = (deps: IProductionLotDependencies) => {
    return async (event: IListProductionLotsEvent) => {
        const query = event.queryStringParameters ?? {}
        const page = Math.max(1, Number(query.page ?? 1))
        const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(query.limit ?? DEFAULT_PAGE_SIZE)))
        const search = query.q?.trim() ?? ""

        let range: { from: string; to: string } | null = null
        if (!search) {
            const from = query.from ?? productionDateKey(new Date())
            const to = query.to ?? addDaysToDateKey(from, DEFAULT_WINDOW_DAYS - 1)
            if (to < from) throw new createError.BadRequest("Bitiş tarihi başlangıçtan önce olamaz.")
            range = { from, to }
        }

        const result = await deps.productionLotRepository.listLots({
            page,
            limit,
            ...(range ?? {}),
            machineId: query.machineId,
            search: search || undefined,
        })
        return apiResponseDTO({
            statusCode: 200,
            payload: { data: await withOperators(deps, result.data), meta: result.meta, range },
        })
    }
}

export const getProductionLotHandler = (deps: IProductionLotDependencies) => {
    return async (event: IGetProductionLotEvent) => {
        const lot = await deps.productionLotRepository.getLotDetail(event.pathParameters.lotNumber)
        if (!lot) throw new createError.NotFound(`${event.pathParameters.lotNumber} numaralı lot bulunamadı.`)

        const roster = await deps.productionShiftAssignmentRepository.listForCells([
            { machineId: lot.job.machine.id, shiftDate: lot.shiftDate, shiftCode: lot.shiftCode },
        ])
        const rosterOperators = roster.map((assignment) => assignment.operator)
        const { lotOperators, notes, ...rest } = lot
        const resolved = resolveLotOperators(lotOperators, rosterOperators)
        const viewer = viewerOf(event)

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                lot: {
                    ...rest,
                    operators: { source: resolved.source, list: resolved.operators },
                    rosterOperators,
                    notes: notes.map((note) => withCanDelete(note, viewer)),
                },
            },
        })
    }
}

/** Lota özel ekip (düzeltme). Boş liste lotu vardiya ekibine döndürür. */
export const replaceProductionLotOperatorsHandler = (deps: IProductionLotDependencies) => {
    return async (event: IReplaceProductionLotOperatorsEvent) => {
        const lot = await deps.productionLotRepository.getLotRef(event.pathParameters.lotNumber)
        if (!lot) throw new createError.NotFound(`${event.pathParameters.lotNumber} numaralı lot bulunamadı.`)

        const { operatorIds } = event.body
        const operators = await deps.productionOperatorRepository.listOperators()
        const issue = findOperatorSelectionIssue({
            operatorIds,
            operators,
            alreadySelectedIds: lot.lotOperatorIds,
            max: MAX_OPERATORS_PER_LOT,
        })
        if (issue) throw new createError.BadRequest(issue)

        await deps.productionLotRepository.replaceLotOperators(lot.id, operatorIds)

        const roster = await deps.productionShiftAssignmentRepository.listForCells([
            { machineId: lot.machineId, shiftDate: lot.shiftDate, shiftCode: lot.shiftCode },
        ])
        const byId = new Map(operators.map((operator) => [operator.id, operator]))
        const lotOperators = operatorIds.map((id) => byId.get(id)).filter((operator): operator is NonNullable<typeof operator> => Boolean(operator))
            .map(({ id, firstName, lastName, employeeNo, isActive }) => ({ id, firstName, lastName, employeeNo, isActive }))
        const resolved = resolveLotOperators(lotOperators, roster.map((assignment) => assignment.operator))
        return apiResponseDTO({ statusCode: 200, payload: { operators: { source: resolved.source, list: resolved.operators } } })
    }
}

export const createProductionLotNoteHandler = (deps: IProductionLotDependencies) => {
    return async (event: ICreateProductionLotNoteEvent) => {
        const lot = await deps.productionLotRepository.getLotRef(event.pathParameters.lotNumber)
        if (!lot) throw new createError.NotFound(`${event.pathParameters.lotNumber} numaralı lot bulunamadı.`)

        const { category, body, operatorId } = event.body
        const issue = findLotNoteIssue(body)
        if (issue) throw new createError.BadRequest(issue)
        if (operatorId) {
            // Geçmiş bir vardiyanın notu pasif operatör adına da girilebilir; yalnız var olmalı.
            const operator = await deps.productionOperatorRepository.getOperator(operatorId)
            if (!operator) throw new createError.BadRequest("Seçilen operatör bulunamadı.")
        }

        const note = await deps.productionLotRepository.createNote({
            lotId: lot.id,
            category,
            body: body.trim(),
            authorUserId: event.user?.id ?? null,
            operatorId: operatorId ?? null,
        })
        return apiResponseDTO({ statusCode: 201, payload: { note: withCanDelete(note, viewerOf(event)) } })
    }
}

/** Notu yalnız yazanı ya da admin / owner siler. */
export const deleteProductionLotNoteHandler = (deps: IProductionLotDependencies) => {
    return async (event: IDeleteProductionLotNoteEvent) => {
        const note = await deps.productionLotRepository.getNote(event.pathParameters.id)
        if (!note) throw new createError.NotFound("Not bulunamadı.")
        if (!canDeleteLotNote(note, viewerOf(event))) {
            throw new createError.Forbidden("Bu notu yalnız yazan kişi ya da yönetici silebilir.")
        }
        await deps.productionLotRepository.deleteNote(note.id)
        return apiResponseDTO({ statusCode: 200, payload: { id: note.id } })
    }
}

// ---- Vardiya raporu (Dilim 4.2) ----

const FUTURE_TOLERANCE_MS = 5 * 60_000

/** Lotu başlatır (anlık izleme): iş Üretimde'ye geçer; işte aynı anda tek lot üretimde. */
export const startProductionLotHandler = (deps: IProductionLotDependencies) => {
    return async (event: IStartProductionLotEvent) => {
        const lot = await deps.productionLotRepository.getLotForReport(event.pathParameters.lotNumber)
        if (!lot) throw new createError.NotFound(`${event.pathParameters.lotNumber} numaralı lot bulunamadı.`)
        const { expectedVersion } = event.body
        if (lot.job.version !== expectedVersion) {
            throw new createError.Conflict(`${lot.lotNumber} işi bu arada değiştirilmiş; sayfayı yenileyip tekrar deneyin.`)
        }

        const running = lot.job.lots.find((entry) => entry.status === "RUNNING" && entry.id !== lot.id)
        const issue = findLotStartIssue({
            jobStatus: lot.job.status,
            lotStatus: lot.status,
            runningLotNumber: running ? formatLotNumber(lot.job.lotBaseNumber, running.sequence) : null,
        })
        if (issue) throw new createError.Conflict(issue)

        const now = new Date()
        const startedAt = event.body.startedAt ? new Date(event.body.startedAt) : now
        if (startedAt.getTime() > now.getTime() + FUTURE_TOLERANCE_MS) throw new createError.BadRequest("Başlangıç gelecekte olamaz.")

        const next = jobStatusAfterLotStart(lot.job.status)
        const saved = await deps.productionLotRepository.startLot({
            lotId: lot.id,
            jobId: lot.job.id,
            expectedVersion,
            startedAt,
            jobStatus: next === lot.job.status ? null : { from: lot.job.status, to: next },
            userId: event.user?.id ?? null,
        })
        if (!saved) throw new createError.Conflict(`${lot.lotNumber} bu arada değiştirilmiş; sayfayı yenileyip tekrar deneyin.`)
        return apiResponseDTO({ statusCode: 200, payload: { lotNumber: lot.lotNumber, jobVersion: saved.version } })
    }
}

/**
 * Vardiya raporu: lotu kapatır. İlk raporda sıradaki planlı lot bu lotun bitişinde başlar; düzeltmede
 * (rapor zaten girilmişse) yalnız değerler değişir. Kalıp sayacı baskı kadar (düzeltmede fark kadar)
 * artar. Kural `core/helpers/production/lotReports.ts`; iyimser kilit işin sürümü.
 */
export const reportProductionLotHandler = (deps: IProductionLotDependencies) => {
    return async (event: IReportProductionLotEvent) => {
        const lot = await deps.productionLotRepository.getLotForReport(event.pathParameters.lotNumber)
        if (!lot) throw new createError.NotFound(`${event.pathParameters.lotNumber} numaralı lot bulunamadı.`)
        const body = event.body
        if (lot.job.version !== body.expectedVersion) {
            throw new createError.Conflict(`${lot.lotNumber} işi bu arada değiştirilmiş; sayfayı yenileyip tekrar deneyin.`)
        }

        const report = {
            actualStartAt: new Date(body.actualStartAt),
            actualEndAt: new Date(body.actualEndAt),
            actualShots: body.actualShots ?? null,
            outputs: body.outputs,
            stops: body.stops.map((stop) => ({ reasonId: stop.reasonId, durationMinutes: stop.durationMinutes, startAt: stop.startAt ? new Date(stop.startAt) : null })),
        }
        const reasons = await deps.productionReasonRepository.listReasons()
        const issues = findLotReportIssues({
            report,
            jobOutputIds: lot.outputs.map((output) => output.jobOutputId),
            jobStatus: lot.job.status,
            reasons,
            keptReasonIds: lot.usedReasonIds,
            now: new Date(),
        })
        if (issues.some((entry) => entry.field === "job")) throw new createError.Conflict(issues[0].message)
        if (issues.length > 0) throw new createError.BadRequest(issues.map((entry) => entry.message).join(" "))

        const handover = body.handoverNote ? { body: body.handoverNote.body, operatorId: body.handoverNote.operatorId ?? null } : null
        if (handover) {
            const noteIssue = findLotNoteIssue(handover.body)
            if (noteIssue) throw new createError.BadRequest(`Devir notu: ${noteIssue}`)
            if (handover.operatorId && !(await deps.productionOperatorRepository.getOperator(handover.operatorId))) {
                throw new createError.BadRequest("Seçilen operatör bulunamadı.")
            }
        }

        const cavitiesById = new Map(lot.outputs.map((output) => [output.jobOutputId, output]))
        const shots = deriveShots({
            actualShots: report.actualShots,
            outputs: body.outputs.map((output) => ({ ...output, cavities: cavitiesById.get(output.jobOutputId)?.cavities ?? 0 })),
        })
        const correction = lot.reportedAt !== null
        const next = correction ? null : nextLotToStart(lot.job.lots, lot.sequence)
        const nextStatus = jobStatusAfterReport(lot.job.status)

        const saved = await deps.productionLotRepository.reportLot({
            lotId: lot.id,
            jobId: lot.job.id,
            expectedVersion: body.expectedVersion,
            jobStatus: nextStatus === lot.job.status ? null : { from: lot.job.status, to: nextStatus },
            userId: event.user?.id ?? null,
            actualStartAt: report.actualStartAt,
            actualEndAt: report.actualEndAt,
            actualShots: shots,
            outputs: body.outputs.map((output) => ({
                lotOutputId: cavitiesById.get(output.jobOutputId)?.lotOutputId as string,
                goodQuantity: output.goodQuantity,
                scrapQuantity: output.scrapQuantity,
                scraps: output.scrapReasons,
            })),
            stops: body.stops.map((stop) => ({
                reasonId: stop.reasonId,
                durationMinutes: stop.durationMinutes,
                startAt: stop.startAt ? new Date(stop.startAt) : null,
                note: stop.note?.trim() || null,
            })),
            nextLot: next ? { id: next.id, startAt: report.actualEndAt } : null,
            moldShotDelta: { moldId: lot.job.moldId, shots: shots - (correction ? lot.actualShots ?? 0 : 0) },
            handoverNote: handover ? { body: handover.body.trim(), operatorId: handover.operatorId } : null,
        })
        if (!saved) throw new createError.Conflict(`${lot.lotNumber} bu arada değiştirilmiş; sayfayı yenileyip tekrar deneyin.`)

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                lotNumber: lot.lotNumber,
                jobVersion: saved.version,
                shots,
                nextLotNumber: next ? formatLotNumber(lot.job.lotBaseNumber, next.sequence) : null,
                correction,
            },
        })
    }
}
