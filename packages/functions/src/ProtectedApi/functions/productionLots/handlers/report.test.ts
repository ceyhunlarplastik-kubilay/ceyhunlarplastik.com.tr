import { describe, expect, it, vi } from "vitest"

import { reportProductionLotHandler, startProductionLotHandler } from "./index"
import type { IReportProductionLotEvent, IStartProductionLotEvent } from "@/functions/ProtectedApi/types/productionLots"

function lotForReport(overrides: Record<string, unknown> = {}) {
    return {
        id: "lot-2",
        lotNumber: "1000-2",
        sequence: 2,
        status: "PLANNED",
        actualShots: null,
        reportedAt: null,
        job: {
            id: "job-1", status: "RELEASED", version: 3, lotBaseNumber: 1000, moldId: "mold-1",
            lots: [{ id: "lot-1", sequence: 1, status: "COMPLETED" }, { id: "lot-2", sequence: 2, status: "PLANNED" }, { id: "lot-3", sequence: 3, status: "PLANNED" }],
        },
        outputs: [{ lotOutputId: "lo-2", jobOutputId: "out-1", cavities: 4 }],
        usedReasonIds: [],
        ...overrides,
    }
}

function buildDeps(lot = lotForReport()) {
    return {
        productionLotRepository: {
            getLotForReport: vi.fn().mockResolvedValue(lot),
            startLot: vi.fn().mockResolvedValue({ version: 4 }),
            reportLot: vi.fn().mockResolvedValue({ version: 4 }),
        },
        productionReasonRepository: {
            listReasons: vi.fn().mockResolvedValue([
                { id: "d1", kind: "STOP", isActive: true },
                { id: "f1", kind: "SCRAP", isActive: true },
                { id: "f-old", kind: "SCRAP", isActive: false },
            ]),
        },
        productionOperatorRepository: { getOperator: vi.fn().mockResolvedValue({ id: "op-1" }) },
        productionShiftAssignmentRepository: { listForCells: vi.fn() },
    }
}

const startEvent = (body: Record<string, unknown> = {}) => ({
    pathParameters: { lotNumber: "1000-2" },
    body: { expectedVersion: 3, ...body },
    user: { id: "u1" },
}) as unknown as IStartProductionLotEvent

const reportBody = (overrides: Record<string, unknown> = {}) => ({
    actualStartAt: "2026-01-05T05:00:00.000Z",
    actualEndAt: "2026-01-05T13:00:00.000Z",
    outputs: [{ jobOutputId: "out-1", goodQuantity: 3_900, scrapQuantity: 101, scrapReasons: [{ reasonId: "f1", quantity: 60 }] }],
    stops: [{ reasonId: "d1", durationMinutes: 45, startAt: null, note: "  Kalıp soğutması  " }],
    expectedVersion: 3,
    ...overrides,
})
const reportEvent = (body = reportBody()) => ({ pathParameters: { lotNumber: "1000-2" }, body, user: { id: "u1" } }) as unknown as IReportProductionLotEvent

describe("lot başlatma", () => {
    it("sahaya verilmiş işte lot başlar, iş Üretimde'ye geçer", async () => {
        const deps = buildDeps()
        await startProductionLotHandler(deps as never)(startEvent({ startedAt: "2026-01-05T05:10:00.000Z" }))
        expect(deps.productionLotRepository.startLot).toHaveBeenCalledWith({
            lotId: "lot-2", jobId: "job-1", expectedVersion: 3, startedAt: new Date("2026-01-05T05:10:00.000Z"),
            jobStatus: { from: "RELEASED", to: "RUNNING" }, userId: "u1",
        })
    })

    it("planlı iş, başka üretimdeki lot, sürüm çakışması 409; gelecekteki başlangıç 400", async () => {
        await expect(startProductionLotHandler(buildDeps(lotForReport({ job: { ...lotForReport().job, status: "PLANNED" } })) as never)(startEvent()))
            .rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("sahaya") })
        const running = lotForReport({ job: { ...lotForReport().job, lots: [{ id: "lot-1", sequence: 1, status: "RUNNING" }, { id: "lot-2", sequence: 2, status: "PLANNED" }] } })
        await expect(startProductionLotHandler(buildDeps(running) as never)(startEvent())).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("1000-1") })
        await expect(startProductionLotHandler(buildDeps() as never)(startEvent({ expectedVersion: 2 }))).rejects.toMatchObject({ statusCode: 409 })
        await expect(startProductionLotHandler(buildDeps() as never)(startEvent({ startedAt: "2099-01-01T00:00:00.000Z" }))).rejects.toMatchObject({ statusCode: 400 })
    })
})

describe("vardiya raporu", () => {
    it("ilk rapor: lot kapanır, sıradaki lot bitişte başlar, sayaç baskı kadar artar, devir notu yazılır", async () => {
        const deps = buildDeps()
        const response = await reportProductionLotHandler(deps as never)(reportEvent(reportBody({ handoverNote: { body: " Kalıp ısınıyor ", operatorId: "op-1" } })))
        const [write] = deps.productionLotRepository.reportLot.mock.calls[0]
        expect(write).toMatchObject({
            lotId: "lot-2",
            jobStatus: { from: "RELEASED", to: "RUNNING" },
            actualShots: 1_001, // ⌈(3.900 + 101) / 4⌉
            outputs: [{ lotOutputId: "lo-2", goodQuantity: 3_900, scrapQuantity: 101, scraps: [{ reasonId: "f1", quantity: 60 }] }],
            stops: [{ reasonId: "d1", durationMinutes: 45, startAt: null, note: "Kalıp soğutması" }],
            nextLot: { id: "lot-3", startAt: new Date("2026-01-05T13:00:00.000Z") },
            moldShotDelta: { moldId: "mold-1", shots: 1_001 },
            handoverNote: { body: "Kalıp ısınıyor", operatorId: "op-1" },
        })
        expect((response.body as unknown as { payload: unknown }).payload).toEqual({ lotNumber: "1000-2", jobVersion: 4, shots: 1_001, nextLotNumber: "1000-3", correction: false })
    })

    it("düzeltme: sıradaki lot başlatılmaz, sayaç fark kadar; eski raporun pasif nedeni kalabilir", async () => {
        const deps = buildDeps(lotForReport({ status: "COMPLETED", reportedAt: new Date(), actualShots: 1_100, usedReasonIds: ["f-old"] }))
        await reportProductionLotHandler(deps as never)(reportEvent(reportBody({
            actualShots: 1_050,
            outputs: [{ jobOutputId: "out-1", goodQuantity: 4_000, scrapQuantity: 100, scrapReasons: [{ reasonId: "f-old", quantity: 100 }] }],
        })))
        const [write] = deps.productionLotRepository.reportLot.mock.calls[0]
        expect(write).toMatchObject({ nextLot: null, actualShots: 1_050, moldShotDelta: { moldId: "mold-1", shots: -50 } })
    })

    it("kurallar: pasif yeni neden 400, eksik çıktı 400, kapanmış iş 409, sürüm çakışması 409", async () => {
        const passive = reportBody({ outputs: [{ jobOutputId: "out-1", goodQuantity: 1, scrapQuantity: 5, scrapReasons: [{ reasonId: "f-old", quantity: 5 }] }] })
        await expect(reportProductionLotHandler(buildDeps() as never)(reportEvent(passive))).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining("Pasif") })
        await expect(reportProductionLotHandler(buildDeps() as never)(reportEvent(reportBody({ outputs: [] })))).rejects.toMatchObject({ statusCode: 400 })
        const closed = lotForReport({ job: { ...lotForReport().job, status: "COMPLETED" } })
        await expect(reportProductionLotHandler(buildDeps(closed) as never)(reportEvent())).rejects.toMatchObject({ statusCode: 409 })
        await expect(reportProductionLotHandler(buildDeps() as never)(reportEvent(reportBody({ expectedVersion: 1 })))).rejects.toMatchObject({ statusCode: 409 })

        const racing = buildDeps()
        racing.productionLotRepository.reportLot.mockResolvedValue(null)
        await expect(reportProductionLotHandler(racing as never)(reportEvent())).rejects.toMatchObject({ statusCode: 409 })
    })
})
