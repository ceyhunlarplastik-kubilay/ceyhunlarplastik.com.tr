import { describe, expect, it, vi } from "vitest"

import { getProductionKanbanHandler, KANBAN_COMPLETED_WINDOW_DAYS, transitionProductionJobHandler } from "./index"
import type { IGetProductionKanbanEvent, ITransitionProductionJobEvent } from "@/functions/ProtectedApi/types/productionJobs"

const JOB_ID = "11111111-1111-4111-8111-111111111111"
const ORDER_ID = "22222222-2222-4222-8222-222222222222"
const OTHER_JOB = "33333333-3333-4333-8333-333333333333"

function buildDeps(job: Record<string, unknown> = {}, orderJobs = [{ id: JOB_ID, status: "RUNNING" }], orderStatus = "IN_PROGRESS") {
    return {
        productionJobRepository: {
            listKanbanJobs: vi.fn().mockResolvedValue([]),
            getJob: vi.fn().mockResolvedValue({
                id: JOB_ID, status: "RUNNING", lotBaseNumber: 1000, machineId: "m", moldId: "k", version: 4,
                orderIds: [ORDER_ID], outputs: [{ id: "out-1", moldOutputId: "mo-1", cavities: 4 }, { id: "out-2", moldOutputId: "mo-2", cavities: 4 }],
                // 1000-1 raporlandı (600 baskı); 1000-2 raporsuz.
                lots: [
                    { id: "l1", sequence: 1, shiftDate: "2026-09-28", shiftCode: "A", noteCount: 0, lotOperatorCount: 0, actualShots: 600, reported: true },
                    { id: "l2", sequence: 2, shiftDate: "2026-09-28", shiftCode: "B", noteCount: 0, lotOperatorCount: 0, actualShots: null, reported: false },
                ],
                ...job,
            }),
            listOrderJobStatuses: vi.fn().mockResolvedValue([{ orderId: ORDER_ID, status: orderStatus, jobs: orderJobs }]),
            transitionJob: vi.fn().mockResolvedValue({ version: 5 }),
        },
        productionShiftAssignmentRepository: { listForCells: vi.fn().mockResolvedValue([]) },
    }
}

const event = (body: Record<string, unknown>) => ({ pathParameters: { id: JOB_ID }, body: { expectedVersion: 4, ...body } }) as unknown as ITransitionProductionJobEvent
const completeOutputs = [
    { jobOutputId: "out-1", goodQuantity: 9800, scrapQuantity: 120 },
    { jobOutputId: "out-2", goodQuantity: 9750, scrapQuantity: 170 },
]

describe("getProductionKanbanHandler", () => {
    it("son günlerde tamamlananlar için pencere", async () => {
        const deps = buildDeps()
        const before = Date.now()
        await getProductionKanbanHandler(deps as never)({} as IGetProductionKanbanEvent)
        const [{ completedSince }] = deps.productionJobRepository.listKanbanJobs.mock.calls[0]
        expect(before - completedSince.getTime()).toBeGreaterThanOrEqual(KANBAN_COMPLETED_WINDOW_DAYS * 86_400_000 - 1000)
    })
})

describe("transitionProductionJobHandler", () => {
    it("tamamlama: adetler + emir Tamamlandı tek yazımda", async () => {
        const deps = buildDeps()
        const response = await transitionProductionJobHandler(deps as never)(event({ status: "COMPLETED", outputs: completeOutputs }))

        expect(deps.productionJobRepository.transitionJob).toHaveBeenCalledWith({
            id: JOB_ID,
            expectedVersion: 4,
            fromStatus: "RUNNING",
            userId: null,
            status: "COMPLETED",
            outputs: completeOutputs,
            orderStatuses: [{ orderId: ORDER_ID, from: "IN_PROGRESS", to: "COMPLETED" }],
            lotOperatorSnapshots: [],
            // Toplamdan 9.920 / 4 = 2.480 baskı; raporlanan 600 → sayaca kalan 1.880.
            moldShotIncrement: { moldId: "k", shots: 1_880 },
        })
        expect((response.body as unknown as { payload: unknown }).payload).toEqual({
            job: { id: JOB_ID, status: "COMPLETED", version: 5 },
            orders: [{ id: ORDER_ID, status: "COMPLETED" }],
        })
    })

    it("emrin başka işi sürüyorsa emir Üretimde kalır (yazılmaz)", async () => {
        const deps = buildDeps({}, [{ id: JOB_ID, status: "RUNNING" }, { id: OTHER_JOB, status: "PLANNED" }])
        await transitionProductionJobHandler(deps as never)(event({ status: "COMPLETED", outputs: completeOutputs }))
        expect(deps.productionJobRepository.transitionJob.mock.calls[0][0].orderStatuses).toEqual([])
    })

    it("sahaya verme emri Serbest yapar; adet gönderilmez", async () => {
        const deps = buildDeps({ status: "PLANNED" }, [{ id: JOB_ID, status: "PLANNED" }], "PLANNED")
        await transitionProductionJobHandler(deps as never)(event({ status: "RELEASED" }))
        expect(deps.productionJobRepository.transitionJob.mock.calls[0][0]).toMatchObject({
            status: "RELEASED",
            outputs: undefined,
            orderStatuses: [{ orderId: ORDER_ID, from: "PLANNED", to: "RELEASED" }],
        })
    })

    it("izinsiz geçiş ve sürüm çakışması 409; eksik adet ya da gereksiz adet 400", async () => {
        await expect(transitionProductionJobHandler(buildDeps({ status: "PLANNED" }) as never)(event({ status: "RUNNING" })))
            .rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("geçilemez") })
        await expect(transitionProductionJobHandler(buildDeps() as never)(event({ status: "PAUSED", expectedVersion: 3 })))
            .rejects.toMatchObject({ statusCode: 409 })
        await expect(transitionProductionJobHandler(buildDeps() as never)(event({ status: "COMPLETED", outputs: [completeOutputs[0]] })))
            .rejects.toMatchObject({ statusCode: 400 })
        await expect(transitionProductionJobHandler(buildDeps() as never)(event({ status: "PAUSED", outputs: completeOutputs })))
            .rejects.toMatchObject({ statusCode: 400 })

        const racing = buildDeps()
        racing.productionJobRepository.transitionJob.mockResolvedValue(null)
        await expect(transitionProductionJobHandler(racing as never)(event({ status: "PAUSED" }))).rejects.toMatchObject({ statusCode: 409 })
    })
})
