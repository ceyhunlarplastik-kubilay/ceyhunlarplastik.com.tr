import createError from "http-errors"

import type { MachineDowntimeWriteInput } from "@/core/helpers/prisma/productionMachineDowntimes/repository"
import { findMachineDowntimeIssues } from "@/core/helpers/production/machineDowntimes"
import { formatProductionTimeRange } from "@/core/helpers/production/productionTime"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { optionalText, withoutUndefined } from "@/functions/shared/production/input"
import type {
    ICreateMachineDowntimeEvent,
    IDeleteMachineDowntimeEvent,
    IListMachineDowntimesEvent,
    IProductionMachineDowntimeDependencies,
    IUpdateMachineDowntimeEvent,
} from "@/functions/ProtectedApi/types/productionMachineDowntimes"

function assertInterval(startAt: Date, endAt: Date) {
    const issues = findMachineDowntimeIssues({ startAt, endAt })
    if (issues.length > 0) throw new createError.BadRequest(issues.map((issue) => issue.message).join(" "))
}

async function assertMachineExists(deps: IProductionMachineDowntimeDependencies, machineId: string) {
    const machine = await deps.productionMachineRepository.getMachine(machineId)
    if (!machine) throw new createError.NotFound("Makine bulunamadı.")
    return machine
}

async function assertNoOverlap(
    deps: IProductionMachineDowntimeDependencies,
    input: { machineId: string; machineCode: string; startAt: Date; endAt: Date; excludeId?: string },
) {
    const overlapping = await deps.productionMachineDowntimeRepository.findOverlappingDowntime(input)
    if (overlapping) {
        throw new createError.Conflict(
            `${input.machineCode} için bu aralıkla çakışan bir duruş var: ${formatProductionTimeRange(overlapping.startAt, overlapping.endAt)}. `
            + "O kaydı düzenleyin ya da aralığı değiştirin.",
        )
    }
}

export const listMachineDowntimesHandler = ({ productionMachineDowntimeRepository }: IProductionMachineDowntimeDependencies) => {
    return async (event: IListMachineDowntimesEvent) => {
        const { machineId, from, to } = event.queryStringParameters ?? {}
        const downtimes = await productionMachineDowntimeRepository.listDowntimes({
            machineId,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
        })
        return apiResponseDTO({ statusCode: 200, payload: { downtimes } })
    }
}

export const createMachineDowntimeHandler = (deps: IProductionMachineDowntimeDependencies) => {
    return async (event: ICreateMachineDowntimeEvent) => {
        const body = event.body
        const input: MachineDowntimeWriteInput = {
            machineId: body.machineId,
            startAt: new Date(body.startAt),
            endAt: new Date(body.endAt),
            kind: body.kind,
            reason: optionalText(body.reason) ?? null,
        }

        assertInterval(input.startAt, input.endAt)
        const machine = await assertMachineExists(deps, input.machineId)
        await assertNoOverlap(deps, { ...input, machineCode: machine.code })

        const downtime = await deps.productionMachineDowntimeRepository.createDowntime({
            ...input,
            createdByUserId: event.user?.id ?? null,
        })
        return apiResponseDTO({ statusCode: 201, payload: { downtime } })
    }
}

export const updateMachineDowntimeHandler = (deps: IProductionMachineDowntimeDependencies) => {
    return async (event: IUpdateMachineDowntimeEvent) => {
        const { id } = event.pathParameters
        const existing = await deps.productionMachineDowntimeRepository.getDowntime(id)
        if (!existing) throw new createError.NotFound("Duruş kaydı bulunamadı.")

        const body = event.body
        const input = withoutUndefined({
            machineId: body.machineId,
            startAt: body.startAt === undefined ? undefined : new Date(body.startAt),
            endAt: body.endAt === undefined ? undefined : new Date(body.endAt),
            kind: body.kind,
            reason: optionalText(body.reason),
        }) as Partial<MachineDowntimeWriteInput>

        // Kısmi güncelleme: kurallar gönderilen değer ile kayıttaki değerin BİRLEŞİMİNE uygulanır.
        const merged = {
            machineId: input.machineId ?? existing.machineId,
            startAt: input.startAt ?? existing.startAt,
            endAt: input.endAt ?? existing.endAt,
        }
        assertInterval(merged.startAt, merged.endAt)
        const machineCode = merged.machineId === existing.machineId
            ? existing.machine.code
            : (await assertMachineExists(deps, merged.machineId)).code
        await assertNoOverlap(deps, { ...merged, machineCode, excludeId: id })

        const downtime = await deps.productionMachineDowntimeRepository.updateDowntime(id, input)
        return apiResponseDTO({ statusCode: 200, payload: { downtime } })
    }
}

export const deleteMachineDowntimeHandler = ({ productionMachineDowntimeRepository }: IProductionMachineDowntimeDependencies) => {
    return async (event: IDeleteMachineDowntimeEvent) => {
        const { id } = event.pathParameters
        const existing = await productionMachineDowntimeRepository.getDowntime(id)
        if (!existing) throw new createError.NotFound("Duruş kaydı bulunamadı.")

        await productionMachineDowntimeRepository.deleteDowntime(id)
        return apiResponseDTO({ statusCode: 200, payload: { id } })
    }
}
