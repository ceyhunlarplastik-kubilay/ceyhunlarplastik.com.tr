import { describe, expect, it, vi } from "vitest"

import {
    bulkDeleteCalendarExceptionsHandler,
    saveCalendarExceptionEntryHandler,
} from "./index"
import type {
    IBulkDeleteCalendarExceptionsEvent,
    ISaveCalendarExceptionEntryEvent,
} from "@/functions/ProtectedApi/types/productionCalendarExceptions"

const AREA_ID = "33333333-3333-4333-8333-333333333333"
const MACHINE_ID = "44444444-4444-4444-8444-444444444444"
const DAY_IDS = ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2"]

function buildDeps(options: { conflicts?: string[]; existingIds?: string[]; areaExists?: boolean } = {}) {
    const { conflicts = [], existingIds = [], areaExists = true } = options
    return {
        productionCalendarExceptionRepository: {
            listExceptions: vi.fn(),
            findExistingIds: vi.fn().mockResolvedValue(new Set(existingIds)),
            findConflictingDateKeys: vi.fn().mockResolvedValue(conflicts),
            replaceEntry: vi.fn().mockResolvedValue([]),
            deleteExceptions: vi.fn().mockResolvedValue(0),
        },
        productionAreaRepository: {
            getArea: vi.fn().mockResolvedValue(areaExists ? { id: AREA_ID } : null),
        },
        productionMachineRepository: {
            getMachine: vi.fn().mockResolvedValue({ id: MACHINE_ID, code: "M-01" }),
        },
    }
}

const saveEvent = (body: Record<string, unknown>) => ({ body }) as unknown as ISaveCalendarExceptionEntryEvent

describe("saveCalendarExceptionEntryHandler", () => {
    it("aralığı günlere açar ve kapsamla birlikte yazar", async () => {
        const deps = buildDeps()

        const response = await saveCalendarExceptionEntryHandler(deps as never)(saveEvent({
            startDate: "2026-05-26",
            endDate: "2026-05-28",
            kind: "HOLIDAY",
            note: "  Kurban Bayramı ",
            areaId: AREA_ID,
        }))

        expect(response.statusCode).toBe(201)
        expect(deps.productionCalendarExceptionRepository.findConflictingDateKeys).toHaveBeenCalledWith({
            dates: ["2026-05-26", "2026-05-27", "2026-05-28"],
            areaId: AREA_ID,
            machineId: null,
            excludeIds: [],
        })
        expect(deps.productionCalendarExceptionRepository.replaceEntry).toHaveBeenCalledWith({
            removeIds: [],
            dates: ["2026-05-26", "2026-05-27", "2026-05-28"],
            kind: "HOLIDAY",
            note: "Kurban Bayramı",
            areaId: AREA_ID,
            machineId: null,
        })
    })

    it("bitişi boş kayıt tek gündür", async () => {
        const deps = buildDeps()

        await saveCalendarExceptionEntryHandler(deps as never)(saveEvent({ startDate: "2026-10-29", kind: "HOLIDAY" }))

        expect(deps.productionCalendarExceptionRepository.replaceEntry.mock.calls[0][0].dates).toEqual(["2026-10-29"])
    })

    it("aynı kapsamda dolu gün varsa 409 verir ve yazmaz", async () => {
        const deps = buildDeps({ conflicts: ["2026-05-27"] })

        await expect(saveCalendarExceptionEntryHandler(deps as never)(saveEvent({
            startDate: "2026-05-26",
            endDate: "2026-05-28",
            kind: "HOLIDAY",
        }))).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("27.05.2026") })
        expect(deps.productionCalendarExceptionRepository.replaceEntry).not.toHaveBeenCalled()
    })

    it("düzenlemede kaydın kendi günleri çakışma sayılmaz ve silinir", async () => {
        const deps = buildDeps({ existingIds: DAY_IDS })

        const response = await saveCalendarExceptionEntryHandler(deps as never)(saveEvent({
            startDate: "2026-05-26",
            endDate: "2026-05-29",
            kind: "SHUTDOWN",
            replaceIds: [...DAY_IDS, DAY_IDS[0]],
        }))

        expect(response.statusCode).toBe(200)
        expect(deps.productionCalendarExceptionRepository.findConflictingDateKeys.mock.calls[0][0].excludeIds).toEqual(DAY_IDS)
        expect(deps.productionCalendarExceptionRepository.replaceEntry.mock.calls[0][0].removeIds).toEqual(DAY_IDS)
    })

    it("düzenlenen kayıt artık yoksa 404", async () => {
        const deps = buildDeps({ existingIds: [DAY_IDS[0]] })

        await expect(saveCalendarExceptionEntryHandler(deps as never)(saveEvent({
            startDate: "2026-05-26",
            kind: "HOLIDAY",
            replaceIds: DAY_IDS,
        }))).rejects.toMatchObject({ statusCode: 404 })
    })

    it("kural ihlalinde (ters aralık, çift kapsam) veritabanına gitmeden 400", async () => {
        const deps = buildDeps()

        await expect(saveCalendarExceptionEntryHandler(deps as never)(saveEvent({
            startDate: "2026-05-30",
            endDate: "2026-05-26",
            kind: "HOLIDAY",
        }))).rejects.toMatchObject({ statusCode: 400 })
        await expect(saveCalendarExceptionEntryHandler(deps as never)(saveEvent({
            startDate: "2026-05-26",
            kind: "HOLIDAY",
            areaId: AREA_ID,
            machineId: MACHINE_ID,
        }))).rejects.toMatchObject({ statusCode: 400 })
        expect(deps.productionCalendarExceptionRepository.findConflictingDateKeys).not.toHaveBeenCalled()
    })

    it("bilinmeyen alan 404", async () => {
        const deps = buildDeps({ areaExists: false })

        await expect(saveCalendarExceptionEntryHandler(deps as never)(saveEvent({
            startDate: "2026-05-26",
            kind: "EXTRA_WORKDAY",
            areaId: AREA_ID,
        }))).rejects.toMatchObject({ statusCode: 404 })
    })
})

describe("bulkDeleteCalendarExceptionsHandler", () => {
    it("id'leri tekilleştirip siler; hiçbiri yoksa 404", async () => {
        const deps = buildDeps()

        await expect(bulkDeleteCalendarExceptionsHandler(deps as never)({
            body: { ids: [DAY_IDS[0], DAY_IDS[0]] },
        } as unknown as IBulkDeleteCalendarExceptionsEvent)).rejects.toMatchObject({ statusCode: 404 })
        expect(deps.productionCalendarExceptionRepository.deleteExceptions).toHaveBeenCalledWith([DAY_IDS[0]])
    })
})
