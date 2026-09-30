import { describe, expect, it, vi } from "vitest"

import { createMachineDowntimeHandler, updateMachineDowntimeHandler } from "./index"
import type {
    ICreateMachineDowntimeEvent,
    IUpdateMachineDowntimeEvent,
} from "@/functions/ProtectedApi/types/productionMachineDowntimes"

const MACHINE_ID = "44444444-4444-4444-8444-444444444444"
const DOWNTIME_ID = "66666666-6666-4666-8666-666666666666"
const USER_ID = "77777777-7777-4777-8777-777777777777"

const existingDowntime = {
    id: DOWNTIME_ID,
    machineId: MACHINE_ID,
    machine: { id: MACHINE_ID, code: "M-01", name: "Enjeksiyon 1" },
    startAt: new Date("2026-09-28T05:00:00.000Z"),
    endAt: new Date("2026-09-28T13:00:00.000Z"),
    kind: "PLANNED_MAINTENANCE",
    reason: null,
}

function buildDeps(options: { machineExists?: boolean; overlapping?: Record<string, unknown> | null } = {}) {
    const { machineExists = true, overlapping = null } = options
    return {
        productionMachineDowntimeRepository: {
            listDowntimes: vi.fn(),
            getDowntime: vi.fn().mockResolvedValue(existingDowntime),
            findOverlappingDowntime: vi.fn().mockResolvedValue(overlapping),
            createDowntime: vi.fn().mockImplementation(async (input) => ({ id: DOWNTIME_ID, ...input })),
            updateDowntime: vi.fn().mockImplementation(async (id, input) => ({ id, ...input })),
            deleteDowntime: vi.fn(),
        },
        productionMachineRepository: {
            getMachine: vi.fn().mockResolvedValue(machineExists ? { id: MACHINE_ID, code: "M-01" } : null),
        },
    }
}

const createEvent = (body: Record<string, unknown>) =>
    ({ body, user: { id: USER_ID } }) as unknown as ICreateMachineDowntimeEvent

const validBody = {
    machineId: MACHINE_ID,
    startAt: "2026-10-05T05:00:00.000Z",
    endAt: "2026-10-05T09:00:00.000Z",
    kind: "PLANNED_MAINTENANCE",
    reason: " Kalıp bağlama ünitesi kontrolü ",
}

describe("createMachineDowntimeHandler", () => {
    it("kaydı giren kullanıcıyı ve kırpılmış açıklamayı yazar", async () => {
        const deps = buildDeps()

        const response = await createMachineDowntimeHandler(deps as never)(createEvent(validBody))

        expect(response.statusCode).toBe(201)
        expect(deps.productionMachineDowntimeRepository.createDowntime).toHaveBeenCalledWith({
            machineId: MACHINE_ID,
            startAt: new Date(validBody.startAt),
            endAt: new Date(validBody.endAt),
            kind: "PLANNED_MAINTENANCE",
            reason: "Kalıp bağlama ünitesi kontrolü",
            createdByUserId: USER_ID,
        })
    })

    it("bitiş başlangıçtan önceyse 400", async () => {
        await expect(createMachineDowntimeHandler(buildDeps() as never)(createEvent({
            ...validBody,
            endAt: "2026-10-05T04:00:00.000Z",
        }))).rejects.toMatchObject({ statusCode: 400 })
    })

    it("bilinmeyen makine 404", async () => {
        await expect(createMachineDowntimeHandler(buildDeps({ machineExists: false }) as never)(createEvent(validBody)))
            .rejects.toMatchObject({ statusCode: 404 })
    })

    it("aynı makinede çakışan duruş varsa 409 ve fabrika saatiyle aralığı yazar", async () => {
        const deps = buildDeps({ overlapping: existingDowntime })

        await expect(createMachineDowntimeHandler(deps as never)(createEvent(validBody))).rejects.toMatchObject({
            statusCode: 409,
            message: expect.stringContaining("M-01 için bu aralıkla çakışan bir duruş var: 28.09.2026 08:00 – 16:00"),
        })
        expect(deps.productionMachineDowntimeRepository.createDowntime).not.toHaveBeenCalled()
    })
})

describe("updateMachineDowntimeHandler — kısmi güncelleme", () => {
    const updateEvent = (body: Record<string, unknown>) =>
        ({ body, pathParameters: { id: DOWNTIME_ID } }) as unknown as IUpdateMachineDowntimeEvent

    it("yalnız bitiş gönderilse de kayıttaki başlangıçla karşılaştırır", async () => {
        const deps = buildDeps()

        await expect(updateMachineDowntimeHandler(deps as never)(updateEvent({ endAt: "2026-09-28T04:00:00.000Z" })))
            .rejects.toMatchObject({ statusCode: 400 })
        expect(deps.productionMachineDowntimeRepository.updateDowntime).not.toHaveBeenCalled()
    })

    it("çakışma kontrolünde kaydın kendisini dışarıda bırakır", async () => {
        const deps = buildDeps()

        await updateMachineDowntimeHandler(deps as never)(updateEvent({ endAt: "2026-09-28T15:00:00.000Z" }))

        expect(deps.productionMachineDowntimeRepository.findOverlappingDowntime).toHaveBeenCalledWith(
            expect.objectContaining({ machineId: MACHINE_ID, excludeId: DOWNTIME_ID }),
        )
        expect(deps.productionMachineDowntimeRepository.updateDowntime).toHaveBeenCalledWith(DOWNTIME_ID, {
            endAt: new Date("2026-09-28T15:00:00.000Z"),
        })
    })
})
