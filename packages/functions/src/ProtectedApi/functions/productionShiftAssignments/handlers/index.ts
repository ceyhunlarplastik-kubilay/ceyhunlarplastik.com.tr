import createError from "http-errors"

import { enumerateDateKeys, formatDateKey } from "@/core/helpers/production/productionCalendar"
import { productionDateKey } from "@/core/helpers/production/productionTime"
import {
    buildRosterDay,
    findOperatorSelectionIssue,
    findRosterCopyIssue,
    MAX_OPERATORS_PER_SHIFT_CELL,
    planRosterCopy,
} from "@/core/helpers/production/shiftAssignments"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type {
    ICopyShiftAssignmentsEvent,
    IGetShiftAssignmentsEvent,
    IProductionShiftAssignmentDependencies,
    IReplaceShiftAssignmentEvent,
} from "@/functions/ProtectedApi/types/productionShiftAssignments"

/** Tanımlar + takvim bir kez okunur; günler bu bağlamla hesaplanır. Pasif makine çizilmez. */
async function loadRosterContext(deps: IProductionShiftAssignmentDependencies, from: string, to: string) {
    const [machines, areas, patterns, exceptions] = await Promise.all([
        deps.productionMachineRepository.listMachines(),
        deps.productionAreaRepository.listAreas(),
        deps.productionShiftPatternRepository.listShiftPatterns(),
        deps.productionCalendarExceptionRepository.listExceptions({ from, to }),
    ])
    const visible = machines.filter((machine) => machine.status !== "INACTIVE")
    const areaShiftPatternIds = Object.fromEntries(areas.map((area) => [area.id, area.shiftPatternId]))
    return {
        machines: visible,
        dayFor: (date: string) => buildRosterDay({ machines: visible, areaShiftPatternIds, patterns, exceptions, date }),
    }
}

export const getShiftAssignmentsHandler = (deps: IProductionShiftAssignmentDependencies) => {
    return async (event: IGetShiftAssignmentsEvent) => {
        const date = event.queryStringParameters?.date ?? productionDateKey(new Date())
        const [context, assignments, operators] = await Promise.all([
            loadRosterContext(deps, date, date),
            deps.productionShiftAssignmentRepository.listForDates([date]),
            deps.productionOperatorRepository.listOperators(),
        ])
        const day = new Map(context.dayFor(date).map((entry) => [entry.machineId, entry]))
        const assigned = new Set(assignments.map((assignment) => assignment.operator.id))

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                date,
                machines: context.machines.map((machine) => {
                    const entry = day.get(machine.id)
                    const shiftCodes = new Set(entry?.shifts.map((shift) => shift.code) ?? [])
                    const idsFor = (code: string) => assignments
                        .filter((assignment) => assignment.machineId === machine.id && assignment.shiftCode === code)
                        .map((assignment) => assignment.operator.id)
                    const orphanCodes = [...new Set(assignments
                        .filter((assignment) => assignment.machineId === machine.id && !shiftCodes.has(assignment.shiftCode))
                        .map((assignment) => assignment.shiftCode))]
                    return {
                        id: machine.id,
                        code: machine.code,
                        name: machine.name,
                        status: machine.status,
                        area: machine.area,
                        shiftPatternName: entry?.shiftPatternName ?? null,
                        exception: entry?.exception ?? null,
                        shifts: (entry?.shifts ?? []).map((shift) => ({ ...shift, operatorIds: idsFor(shift.code) })),
                        orphans: orphanCodes.map((code) => ({ shiftCode: code, operatorIds: idsFor(code) })),
                    }
                }),
                // Aktif operatörler + o gün atanmış pasif olanlar (ad gösterilebilsin).
                operators: operators
                    .filter((operator) => operator.isActive || assigned.has(operator.id))
                    .map(({ id, firstName, lastName, employeeNo, isActive }) => ({ id, firstName, lastName, employeeNo, isActive })),
            },
        })
    }
}

/**
 * Hücrenin ekibini değiştirir. Doldururken hücre makinenin o gün GERÇEKTEN çalışan bir vardiyası
 * olmalı; boşaltmak her zaman serbest (düzen dışı kalmış atamaları temizlemek için).
 */
export const replaceShiftAssignmentHandler = (deps: IProductionShiftAssignmentDependencies) => {
    return async (event: IReplaceShiftAssignmentEvent) => {
        const { machineId, shiftDate, shiftCode, operatorIds } = event.body

        if (operatorIds.length > 0) {
            const context = await loadRosterContext(deps, shiftDate, shiftDate)
            const machine = context.machines.find((entry) => entry.id === machineId)
            if (!machine) throw new createError.NotFound("Makine bulunamadı ya da pasif.")
            const entry = context.dayFor(shiftDate).find((day) => day.machineId === machineId)
            if (!entry?.shifts.some((shift) => shift.code === shiftCode)) {
                throw new createError.Conflict(`${machine.code} ${formatDateKey(shiftDate)} günü ${shiftCode} vardiyasında çalışmıyor.`)
            }
        }

        const [operators, current] = await Promise.all([
            deps.productionOperatorRepository.listOperators(),
            deps.productionShiftAssignmentRepository.listForCells([{ machineId, shiftDate, shiftCode }]),
        ])
        const issue = findOperatorSelectionIssue({
            operatorIds,
            operators,
            alreadySelectedIds: current.map((assignment) => assignment.operator.id),
            max: MAX_OPERATORS_PER_SHIFT_CELL,
        })
        if (issue) throw new createError.BadRequest(issue)

        await deps.productionShiftAssignmentRepository.replaceCell({ machineId, shiftDate, shiftCode }, operatorIds)
        return apiResponseDTO({ statusCode: 200, payload: { cell: { machineId, shiftDate, shiftCode, operatorIds } } })
    }
}

/** Bir günün ekibini sonraki (ya da önceki) günlere kopyalar; hedef günlerin ekibi TAMAMEN değişir. */
export const copyShiftAssignmentsHandler = (deps: IProductionShiftAssignmentDependencies) => {
    return async (event: ICopyShiftAssignmentsEvent) => {
        const { fromDate, toStart, toEnd } = event.body
        const issue = findRosterCopyIssue({ fromDate, toStart, toEnd })
        if (issue) throw new createError.BadRequest(issue)

        const dates = enumerateDateKeys(toStart, toEnd)
        const [context, source, operators] = await Promise.all([
            loadRosterContext(deps, toStart, toEnd),
            deps.productionShiftAssignmentRepository.listForDates([fromDate]),
            deps.productionOperatorRepository.listOperators(),
        ])
        const rows = planRosterCopy({
            source: source.map((assignment) => ({ machineId: assignment.machineId, shiftCode: assignment.shiftCode, operatorId: assignment.operator.id })),
            targetDays: dates.map((date) => ({ date, machines: context.dayFor(date) })),
            activeOperatorIds: new Set(operators.filter((operator) => operator.isActive).map((operator) => operator.id)),
        })
        const created = await deps.productionShiftAssignmentRepository.replaceDays(dates, rows)
        return apiResponseDTO({ statusCode: 200, payload: { days: dates.length, created } })
    }
}
