import { describe, expect, it, vi } from "vitest"

import {
    createShiftPatternHandler,
    deleteShiftPatternHandler,
    replaceShiftPatternHandler,
} from "./index"
import type {
    ICreateShiftPatternEvent,
    IDeleteShiftPatternEvent,
    IReplaceShiftPatternEvent,
    IShiftPatternBody,
} from "@/functions/ProtectedApi/types/productionShiftPatterns"

const PATTERN_ID = "11111111-1111-4111-8111-111111111111"

const validBody: IShiftPatternBody = {
    name: " Günde 16 saat ",
    shifts: [
        { code: "a", name: "Gündüz", startMinute: 480, durationMinutes: 480, daysOfWeek: [1, 2, 3, 4, 5] },
        { code: "B", name: "Akşam", startMinute: 960, durationMinutes: 480, daysOfWeek: [5, 1, 2, 3, 4] },
    ],
}

function buildRepository(existing: { isDefault: boolean; machineCount?: number; areaCount?: number } | null = null) {
    return {
        getShiftPattern: vi.fn().mockResolvedValue(
            existing ? { id: PATTERN_ID, machineCount: 0, areaCount: 0, ...existing } : null,
        ),
        createShiftPattern: vi.fn().mockImplementation(async (input) => ({ id: PATTERN_ID, ...input })),
        replaceShiftPattern: vi.fn().mockImplementation(async (id, input) => ({ id, ...input })),
        deleteShiftPattern: vi.fn(),
        listShiftPatterns: vi.fn(),
    }
}

const createEvent = (body: IShiftPatternBody) => ({ body }) as unknown as ICreateShiftPatternEvent
const replaceEvent = (body: IShiftPatternBody) =>
    ({ body, pathParameters: { id: PATTERN_ID } }) as unknown as IReplaceShiftPatternEvent
const deleteEvent = { pathParameters: { id: PATTERN_ID } } as unknown as IDeleteShiftPatternEvent

describe("createShiftPatternHandler", () => {
    it("adı kırpar, vardiyaları normalleştirip (kod büyük harf, günler sıralı) yazar", async () => {
        const repository = buildRepository()

        await createShiftPatternHandler({ productionShiftPatternRepository: repository as never })(createEvent(validBody))

        const input = repository.createShiftPattern.mock.calls[0][0]
        expect(input.name).toBe("Günde 16 saat")
        expect(input.isDefault).toBe(false)
        expect(input.shifts.map((shift: { code: string }) => shift.code)).toEqual(["A", "B"])
        expect(input.shifts[1].daysOfWeek).toEqual([1, 2, 3, 4, 5])
    })

    it("örtüşen vardiyaları yazmadan 400 ile reddeder", async () => {
        const repository = buildRepository()
        const overlapping: IShiftPatternBody = {
            ...validBody,
            shifts: [validBody.shifts[0], { ...validBody.shifts[1], startMinute: 600 }],
        }

        await expect(
            createShiftPatternHandler({ productionShiftPatternRepository: repository as never })(createEvent(overlapping)),
        ).rejects.toMatchObject({ statusCode: 400 })
        expect(repository.createShiftPattern).not.toHaveBeenCalled()
    })
})

describe("replaceShiftPatternHandler — varsayılan düzen", () => {
    it("varsayılanlık doğrudan kaldırılamaz", async () => {
        const repository = buildRepository({ isDefault: true })

        await expect(
            replaceShiftPatternHandler({ productionShiftPatternRepository: repository as never })(
                replaceEvent({ ...validBody, isDefault: false }),
            ),
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("isDefault gönderilmezse mevcut değer korunur", async () => {
        const repository = buildRepository({ isDefault: true })

        await replaceShiftPatternHandler({ productionShiftPatternRepository: repository as never })(replaceEvent(validBody))

        expect(repository.replaceShiftPattern.mock.calls[0][1].isDefault).toBe(true)
    })
})

describe("deleteShiftPatternHandler", () => {
    it("varsayılan düzen silinemez", async () => {
        const repository = buildRepository({ isDefault: true })

        await expect(
            deleteShiftPatternHandler({ productionShiftPatternRepository: repository as never })(deleteEvent),
        ).rejects.toMatchObject({ statusCode: 409 })
    })

    it("makine/alanda kullanılan düzen silinemez; kullanılmayan silinir", async () => {
        const used = buildRepository({ isDefault: false, machineCount: 2 })
        await expect(
            deleteShiftPatternHandler({ productionShiftPatternRepository: used as never })(deleteEvent),
        ).rejects.toMatchObject({ statusCode: 409 })
        expect(used.deleteShiftPattern).not.toHaveBeenCalled()

        const unused = buildRepository({ isDefault: false })
        await deleteShiftPatternHandler({ productionShiftPatternRepository: unused as never })(deleteEvent)
        expect(unused.deleteShiftPattern).toHaveBeenCalledWith(PATTERN_ID)
    })
})
