import { afterEach, describe, expect, it, vi } from "vitest"

import {
    deleteProductionJobHandler,
    getProductionOrderCandidatesHandler,
    planProductionOrderHandler,
    pushJobFollowersHandler,
    rescheduleProductionJobHandler,
} from "./index"
import type {
    IDeleteProductionJobEvent,
    IGetProductionOrderCandidatesEvent,
    IPlanProductionOrderEvent,
    IPushJobFollowersEvent,
    IRescheduleProductionJobEvent,
} from "@/functions/ProtectedApi/types/productionOrders"

const ORDER_ID = "11111111-1111-4111-8111-111111111111"
const SIZE_ID = "22222222-2222-4222-8222-222222222222"

const order = {
    id: ORDER_ID,
    orderNumber: 1001,
    quantity: 1000,
    dueDate: null,
    status: "DRAFT",
    cycleTimeOverrideSec: null,
    variantCode: "10.1.3.V1",
    productVariant: { size: { id: SIZE_ID }, version: { materialIds: ["pp", "pe"], signature: "color:k|materials:pp" } },
}

const MACHINE_ID = "33333333-3333-4333-8333-333333333333"
const MON_SAT = [1, 2, 3, 4, 5, 6]
const machine = {
    id: MACHINE_ID, code: "M-01", name: "Arburg", areaId: "a1", status: "ACTIVE", clampForceTon: 50,
    tieBarHorizontalMm: 320, tieBarVerticalMm: 320, minMoldHeightMm: 200, maxMoldHeightMm: null,
    maxOpeningStrokeMm: 350, maxDaylightMm: 550, shotCapacityG: 65, locatingRingDiameterMm: null,
    hotRunnerZones: 0, coreCircuits: 1, hasRobot: true, plannedEfficiencyPercent: 85, hourlyCost: 250,
    currency: "TRY", shiftPatternId: null,
}
const pattern = {
    id: "p", isDefault: true, timezone: "Europe/Istanbul",
    shifts: [{ code: "A", name: "Gündüz", startMinute: 480, durationMinutes: 720, daysOfWeek: MON_SAT, sortOrder: 0 }],
}

const mold = (id: string, status: string, sizeId: string) => ({
    id, code: id, name: id, status, requiredClampForceTon: 30, widthMm: 246, heightMm: 246, thicknessMm: 226,
    requiredOpeningStrokeMm: 150, locatingRingDiameterMm: null, hotRunnerZones: 0, coreCircuitsRequired: 0,
    requiresRobot: false, runnerWeightG: 2, standardCycleTimeSec: 20, expectedScrapPercent: 0, setupMinutes: 30,
    outputs: [{ id: `${id}-out`, productSizeId: sizeId, cavities: 4, partWeightG: 3 }], machineProfiles: [],
})

function buildDeps(orderOverride: Record<string, unknown> | null = order, options: { withMachine?: boolean } = {}) {
    return {
        productionJobRepository: {
            listActiveJobIntervals: vi.fn().mockResolvedValue([]),
            createJobPlan: vi.fn(),
            listPlannedJobsOnMachine: vi.fn().mockResolvedValue([]),
            commitPlacement: vi.fn().mockImplementation(async (write: { create?: unknown; reschedules: Array<{ id: string }> }) => ({
                created: write.create ? { jobId: "j", lotBaseNumber: 1000 } : null,
                versions: Object.fromEntries(write.reschedules.map((entry) => [entry.id, 1])),
            })),
            getJob: vi.fn(),
            getJobForForecast: vi.fn(),
            deleteJob: vi.fn(),
            rescheduleJob: vi.fn(),
        },
        productionOrderRepository: { getOrder: vi.fn().mockResolvedValue(orderOverride) },
        productionMoldRepository: { listMolds: vi.fn().mockResolvedValue([mold("K-1", "ACTIVE", SIZE_ID), mold("K-2", "RETIRED", SIZE_ID), mold("K-3", "ACTIVE", "other")]) },
        productionMachineRepository: { listMachines: vi.fn().mockResolvedValue(options.withMachine ? [machine] : []) },
        productionAreaRepository: { listAreas: vi.fn().mockResolvedValue([]) },
        productionShiftPatternRepository: { listShiftPatterns: vi.fn().mockResolvedValue(options.withMachine ? [pattern] : []) },
        productionCalendarExceptionRepository: { listExceptions: vi.fn().mockResolvedValue([]) },
        productionMachineDowntimeRepository: { listDowntimes: vi.fn().mockResolvedValue([]) },
        productionMaterialProfileRepository: {
            listMaterialsWithProfiles: vi.fn().mockResolvedValue([
                { id: "pp", profile: { cycleTimeFactor: 1 } },
                { id: "pe", profile: { cycleTimeFactor: 1.15 } },
                { id: "abs", profile: { cycleTimeFactor: 2 } },
            ]),
        },
    }
}

const event = { pathParameters: { id: ORDER_ID } } as unknown as IGetProductionOrderCandidatesEvent

describe("getProductionOrderCandidatesHandler", () => {
    it("varyantı silinmiş ya da kapanmış emir planlanamaz (409)", async () => {
        await expect(getProductionOrderCandidatesHandler(buildDeps({ ...order, productVariant: null }) as never)(event))
            .rejects.toMatchObject({ statusCode: 409 })
        await expect(getProductionOrderCandidatesHandler(buildDeps({ ...order, status: "CANCELLED" }) as never)(event))
            .rejects.toMatchObject({ statusCode: 409 })
        await expect(getProductionOrderCandidatesHandler(buildDeps(null) as never)(event))
            .rejects.toMatchObject({ statusCode: 404 })
    })

    it("tanımları okuyup önizleme döner; hiçbir şey yazmaz", async () => {
        const deps = buildDeps()
        const response = await getProductionOrderCandidatesHandler(deps as never)(event)

        expect(response.statusCode).toBe(200)
        expect(deps.productionCalendarExceptionRepository.listExceptions).toHaveBeenCalledWith(
            expect.objectContaining({ from: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), to: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) }),
        )
        expect((response.body as unknown as { payload: unknown }).payload).toMatchObject({ horizonDays: 45, candidates: [], excluded: [] })
    })
})

describe("planProductionOrderHandler", () => {
    const planEvent = (moldId: string) => ({
        pathParameters: { id: ORDER_ID },
        body: { machineId: MACHINE_ID, moldId },
        user: { id: "44444444-4444-4444-8444-444444444444" },
    }) as unknown as IPlanProductionOrderEvent

    it("planı sunucuda yeniden hesaplar ve iş + lotları tek seferde yazar", async () => {
        const deps = buildDeps(order, { withMachine: true })
        const response = await planProductionOrderHandler(deps as never)(planEvent("K-1"))

        expect(response.statusCode).toBe(201)
        const [{ create, reschedules }] = deps.productionJobRepository.commitPlacement.mock.calls[0]
        const { plan, orderId } = create
        expect(orderId).toBe(ORDER_ID)
        expect(reschedules).toEqual([])
        // İlk boşluk kipinde kaydırma adayları hiç okunmaz.
        expect(deps.productionJobRepository.listPlannedJobsOnMachine).not.toHaveBeenCalled()
        expect(plan.job).toMatchObject({ machineId: MACHINE_ID, moldId: "K-1", versionSignature: "color:k|materials:pp", plannedShots: 250 })
        expect(plan.outputs).toEqual([expect.objectContaining({ moldOutputId: "K-1-out", productionOrderId: ORDER_ID, plannedQuantity: 1000 })])
        expect(plan.lots.length).toBeGreaterThan(0)
    })

    it("tahtaya sürüklenen emir: kalıp verilmezse makinede uygun kalıp seçilir, istenen andan başlar", async () => {
        const deps = buildDeps(order, { withMachine: true })
        const event = {
            pathParameters: { id: ORDER_ID },
            body: { machineId: MACHINE_ID, startAt: "2099-01-06T05:00:00.000Z" },
        } as unknown as IPlanProductionOrderEvent
        const response = await planProductionOrderHandler(deps as never)(event)

        const [{ create }] = deps.productionJobRepository.commitPlacement.mock.calls[0]
        expect(create.plan.job.moldId).toBe("K-1")
        expect(create.plan.job.setupStartAt.toISOString()).toBe("2099-01-06T05:00:00.000Z")
        expect((response.body as unknown as { payload: { shifted: boolean; shiftedJobs: unknown[] } }).payload).toMatchObject({ shifted: false, shiftedJobs: [] })
    })

    it("uygun olmayan çift ve planlanmış emir 409", async () => {
        await expect(planProductionOrderHandler(buildDeps(order, { withMachine: true }) as never)(planEvent("K-3")))
            .rejects.toMatchObject({ statusCode: 409 })
        await expect(planProductionOrderHandler(buildDeps({ ...order, status: "PLANNED" }, { withMachine: true }) as never)(planEvent("K-1")))
            .rejects.toMatchObject({ statusCode: 409 })
    })
})

describe("deleteProductionJobHandler", () => {
    const deleteEvent = { pathParameters: { id: "j" } } as unknown as IDeleteProductionJobEvent

    it("yalnız planlı iş iptal edilir; bağlı emirler iletilir", async () => {
        const deps = buildDeps()
        deps.productionJobRepository.getJob.mockResolvedValue({ id: "j", status: "RUNNING", lotBaseNumber: 1000, orderIds: [ORDER_ID] })
        await expect(deleteProductionJobHandler(deps as never)(deleteEvent)).rejects.toMatchObject({ statusCode: 409 })

        deps.productionJobRepository.getJob.mockResolvedValue({ id: "j", status: "PLANNED", lotBaseNumber: 1000, orderIds: [ORDER_ID] })
        await deleteProductionJobHandler(deps as never)(deleteEvent)
        expect(deps.productionJobRepository.deleteJob).toHaveBeenCalledWith("j", [ORDER_ID])
    })
})

describe("rescheduleProductionJobHandler", () => {
    const JOB_ID = "55555555-5555-4555-8555-555555555555"
    const summary = {
        id: JOB_ID, status: "PLANNED", lotBaseNumber: 1000, machineId: MACHINE_ID, moldId: "K-1", version: 3,
        orderIds: [ORDER_ID], outputs: [{ id: "out-1", moldOutputId: "K-1-out" }], lots: [],
    }
    const moveEvent = (body: Partial<{ machineId: string; startAt: string; expectedVersion: number }> = {}) => ({
        pathParameters: { id: JOB_ID },
        body: { machineId: MACHINE_ID, startAt: "2099-01-05T05:00:00.000Z", expectedVersion: 3, ...body },
    }) as unknown as IRescheduleProductionJobEvent

    function moveDeps(jobOverride: Record<string, unknown> = {}) {
        const deps = buildDeps({ ...order, status: "PLANNED" }, { withMachine: true })
        deps.productionJobRepository.getJob.mockResolvedValue({ ...summary, ...jobOverride })
        deps.productionJobRepository.listActiveJobIntervals.mockResolvedValue([
            // İşin kendi aralığı — taşımada meşgul sayılmamalı.
            { id: JOB_ID, machineId: MACHINE_ID, moldId: "K-1", startAt: new Date("2099-01-05T00:00:00Z"), endAt: new Date("2099-01-20T00:00:00Z") },
        ])
        return deps
    }

    it("istenen andan sonraki ilk vardiyaya yerleştirir; lotlar mevcut çıktılara bağlanır, sürüm iletilir", async () => {
        const deps = moveDeps()
        const response = await rescheduleProductionJobHandler(deps as never)(moveEvent())

        const [{ reschedules }] = deps.productionJobRepository.commitPlacement.mock.calls[0]
        const [{ id: jobId, expectedVersion, write }] = reschedules
        expect([jobId, expectedVersion]).toEqual([JOB_ID, 3])
        expect(write.job.machineId).toBe(MACHINE_ID)
        // 2099-01-05 Pazartesi 08:00 (TR) = 05:00Z — kendi aralığı engel olmadı.
        expect(write.job.setupStartAt.toISOString()).toBe("2099-01-05T05:00:00.000Z")
        expect(write.lotOutputs.every((entry: { jobOutputId: string }) => entry.jobOutputId === "out-1")).toBe(true)
        expect(deps.productionMoldRepository.listMolds).toHaveBeenCalled()
        expect((response.body as unknown as { payload: { shifted: boolean; job: { version: number } } }).payload).toMatchObject({ shifted: false, job: { version: 1 } })
    })

    it("vardiya dışına bırakılan iş sonraki vardiyaya kayar (shifted)", async () => {
        const response = await rescheduleProductionJobHandler(moveDeps() as never)(moveEvent({ startAt: "2099-01-05T18:00:00.000Z" }))
        expect((response.body as unknown as { payload: { shifted: boolean } }).payload.shifted).toBe(true)
    })

    it("sürüm tutmazsa, iş planlı değilse, emri yoksa ya da yazımda sürüm çakışırsa 409", async () => {
        await expect(rescheduleProductionJobHandler(moveDeps() as never)(moveEvent({ expectedVersion: 2 })))
            .rejects.toMatchObject({ statusCode: 409 })
        await expect(rescheduleProductionJobHandler(moveDeps({ status: "RUNNING" }) as never)(moveEvent()))
            .rejects.toMatchObject({ statusCode: 409 })
        await expect(rescheduleProductionJobHandler(moveDeps({ orderIds: [] }) as never)(moveEvent()))
            .rejects.toMatchObject({ statusCode: 409 })

        const racing = moveDeps()
        racing.productionJobRepository.commitPlacement.mockResolvedValue(null)
        await expect(rescheduleProductionJobHandler(racing as never)(moveEvent())).rejects.toMatchObject({ statusCode: 409 })
    })

    it("kalıbın çalışamadığı makineye taşıma 409 ve gerekçe", async () => {
        const deps = moveDeps()
        deps.productionMachineRepository.listMachines.mockResolvedValue([{ ...machine, clampForceTon: 10 }])
        await expect(rescheduleProductionJobHandler(deps as never)(moveEvent()))
            .rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("M-01") })
        expect(deps.productionJobRepository.commitPlacement).not.toHaveBeenCalled()
    })

    it("sonrakileri kaydır: bırakılan andan sonra başlayan planlı iş taşınan işin arkasına kayar; hepsi tek yazımda", async () => {
        const FOLLOWER_ID = "66666666-6666-4666-8666-666666666666"
        const follower = {
            id: FOLLOWER_ID, status: "PLANNED", lotBaseNumber: 1001, machineId: MACHINE_ID, moldId: "K-1", version: 7,
            orderIds: [ORDER_ID], outputs: [{ id: "f-out", moldOutputId: "K-1-out" }], lots: [],
            setupStartAt: new Date("2099-01-05T06:00:00Z"), plannedEndAt: new Date("2099-01-05T07:00:00Z"),
        }
        const deps = moveDeps()
        deps.productionJobRepository.listActiveJobIntervals.mockResolvedValue([
            { id: JOB_ID, machineId: MACHINE_ID, moldId: "K-1", startAt: new Date("2099-01-12T05:00:00Z"), endAt: new Date("2099-01-12T08:00:00Z") },
            { id: FOLLOWER_ID, machineId: MACHINE_ID, moldId: "K-1", startAt: follower.setupStartAt, endAt: follower.plannedEndAt },
        ])
        deps.productionJobRepository.listPlannedJobsOnMachine.mockResolvedValue([follower])

        const response = await rescheduleProductionJobHandler(deps as never)(moveEvent({ placement: "push-later" } as never))

        const [{ reschedules }] = deps.productionJobRepository.commitPlacement.mock.calls[0]
        expect(reschedules.map((entry: { id: string; expectedVersion: number }) => [entry.id, entry.expectedVersion])).toEqual([[JOB_ID, 3], [FOLLOWER_ID, 7]])
        const [moved, shifted] = reschedules
        // Taşınan iş tam bırakılan anda (takipçi engel sayılmadı), takipçi onun bitişinden sonra.
        expect(moved.write.job.setupStartAt.toISOString()).toBe("2099-01-05T05:00:00.000Z")
        expect(shifted.write.job.setupStartAt.getTime()).toBeGreaterThanOrEqual(moved.write.job.plannedEndAt.getTime())
        expect(shifted.write.lotOutputs.every((entry: { jobOutputId: string }) => entry.jobOutputId === "f-out")).toBe(true)
        expect((response.body as unknown as { payload: { shiftedJobs: Array<{ id: string }> } }).payload.shiftedJobs).toEqual([
            expect.objectContaining({ id: FOLLOWER_ID, lotBaseNumber: 1001 }),
        ])
    })

    it("sonrakileri kaydır: çakışmayan takipçi yerinde kalır ve yazılmaz", async () => {
        // Takipçinin motorun vereceği yeri: aynı emir/kalıp/makine, Salı 08:00 (TR) başlangıç.
        const probe = moveDeps()
        await rescheduleProductionJobHandler(probe as never)(moveEvent({ startAt: "2099-01-06T05:00:00.000Z" }))
        const probeJob = probe.productionJobRepository.commitPlacement.mock.calls[0][0].reschedules[0].write.job

        const deps = moveDeps()
        deps.productionJobRepository.listPlannedJobsOnMachine.mockResolvedValue([{
            id: "77777777-7777-4777-8777-777777777777", status: "PLANNED", lotBaseNumber: 1002, machineId: MACHINE_ID, moldId: "K-1", version: 1,
            orderIds: [ORDER_ID], outputs: [{ id: "g-out", moldOutputId: "K-1-out" }], lots: [],
            setupStartAt: probeJob.setupStartAt, plannedEndAt: probeJob.plannedEndAt,
        }])
        // Taşınan iş Pazartesi bitiyor → Salı'daki takipçiye değmiyor.
        await rescheduleProductionJobHandler(deps as never)(moveEvent({ placement: "push-later" } as never))
        const [{ reschedules }] = deps.productionJobRepository.commitPlacement.mock.calls[0]
        expect(reschedules.map((entry: { id: string }) => entry.id)).toEqual([JOB_ID])
    })
})

describe("pushJobFollowersHandler", () => {
    const JOB_ID = "88888888-8888-4888-8888-888888888888"
    const FOLLOWER_ID = "99999999-9999-4999-8999-999999999999"
    // 2099-01-05 Pazartesi; vardiya 08:00–20:00 (TR) = 05:00Z–17:00Z.
    // 360 baskı × 20 sn, verim %100 → 120 dk üretim; plan 05:00Z bağlama, 05:30Z–07:30Z üretim.
    const forecastJobDto = (override: Record<string, unknown> = {}) => ({
        id: JOB_ID, status: "RUNNING", lotBaseNumber: 2000, machineId: MACHINE_ID, moldId: "K-1",
        setupStartAt: new Date("2099-01-05T05:00:00Z"), productionStartAt: new Date("2099-01-05T05:30:00Z"),
        plannedEndAt: new Date("2099-01-05T07:30:00Z"), plannedShots: 360, cycleTimeSec: 20, efficiencyPercent: 100,
        setupMinutes: 30, dueDates: [],
        // Üretim 90 dk geç başladı → tahmini bitiş 09:00Z.
        lots: [{ status: "RUNNING", actualStartAt: new Date("2099-01-05T07:00:00Z"), actualEndAt: null, actualShots: null, reported: false }],
        ...override,
    })
    const follower = {
        id: FOLLOWER_ID, status: "PLANNED", lotBaseNumber: 2001, machineId: MACHINE_ID, moldId: "K-1", version: 4,
        orderIds: [ORDER_ID], outputs: [{ id: "f-out", moldOutputId: "K-1-out" }], lots: [],
        setupStartAt: new Date("2099-01-05T07:30:00Z"), plannedEndAt: new Date("2099-01-05T09:30:00Z"),
    }
    const pushEvent = { pathParameters: { id: JOB_ID } } as unknown as IPushJobFollowersEvent

    function pushDeps(jobOverride: Record<string, unknown> = {}, followers: unknown[] = [follower]) {
        const deps = buildDeps({ ...order, status: "PLANNED" }, { withMachine: true })
        deps.productionJobRepository.getJobForForecast.mockResolvedValue(forecastJobDto(jobOverride))
        deps.productionJobRepository.listPlannedJobsOnMachine.mockResolvedValue(followers)
        return deps
    }

    afterEach(() => {
        vi.useRealTimers()
    })

    it("geciken işin tahmini bitişinin arkasına planlı takipçiyi kaydırır; tahmin sunucuda hesaplanır", async () => {
        vi.useFakeTimers({ now: new Date("2099-01-05T08:00:00Z"), toFake: ["Date"] })
        const deps = pushDeps()
        const response = await pushJobFollowersHandler(deps as never)(pushEvent)

        const [{ create, reschedules }] = deps.productionJobRepository.commitPlacement.mock.calls[0]
        expect(create).toBeUndefined()
        expect(reschedules.map((entry: { id: string; expectedVersion: number }) => [entry.id, entry.expectedVersion])).toEqual([[FOLLOWER_ID, 4]])
        expect(reschedules[0].write.job.setupStartAt.toISOString()).toBe("2099-01-05T09:00:00.000Z")
        expect(reschedules[0].write.lotOutputs.every((entry: { jobOutputId: string }) => entry.jobOutputId === "f-out")).toBe(true)
        // Takvim, üretimin gerçekten başladığı andan (geçmişten) itibaren okunur.
        expect(deps.productionMachineDowntimeRepository.listDowntimes).toHaveBeenCalledWith(expect.objectContaining({ from: new Date("2099-01-05T07:00:00Z") }))
        expect(deps.productionCalendarExceptionRepository.listExceptions).toHaveBeenCalledWith(expect.objectContaining({ from: "2099-01-04" }))
        expect(deps.productionJobRepository.listPlannedJobsOnMachine).toHaveBeenCalledWith(MACHINE_ID, new Date("2099-01-05T05:00:00Z"))
        expect((response.body as unknown as { payload: unknown }).payload).toEqual({
            projectedEndAt: "2099-01-05T09:00:00.000Z",
            delayMinutes: 90,
            shiftedJobs: [expect.objectContaining({ id: FOLLOWER_ID, lotBaseNumber: 2001, toStartAt: "2099-01-05T09:00:00.000Z" })],
        })
    })

    it("sahaya verilmiş ama başlamamış iş: bağlama dahil şimdiden itibaren tahmin edilir", async () => {
        vi.useFakeTimers({ now: new Date("2099-01-05T07:00:00Z"), toFake: ["Date"] })
        const deps = pushDeps({ status: "RELEASED", lots: [] })
        const response = await pushJobFollowersHandler(deps as never)(pushEvent)

        // 07:00Z + 30 dk bağlama + 120 dk üretim = 09:30Z → takipçi ona kayar.
        expect((response.body as unknown as { payload: { projectedEndAt: string } }).payload.projectedEndAt).toBe("2099-01-05T09:30:00.000Z")
        const [{ reschedules }] = deps.productionJobRepository.commitPlacement.mock.calls[0]
        expect(reschedules[0].write.job.setupStartAt.toISOString()).toBe("2099-01-05T09:30:00.000Z")
    })

    it("planlı, kapanmış, plana uygun ya da arkasında iş olmayan iş için 409; hiçbir şey yazılmaz", async () => {
        vi.useFakeTimers({ now: new Date("2099-01-05T06:00:00Z"), toFake: ["Date"] })
        const cases: Array<[Record<string, unknown>, unknown[], string]> = [
            [{ status: "PLANNED" }, [follower], "henüz planlı"],
            [{ status: "COMPLETED" }, [follower], "kapanmış"],
            // Üretim planlanan anda başladı → 07:30Z'de biter.
            [{ lots: [{ status: "RUNNING", actualStartAt: new Date("2099-01-05T05:30:00Z"), actualEndAt: null, actualShots: null, reported: false }] }, [follower], "planına göre"],
            [{}, [], "M-01"],
        ]
        for (const [jobOverride, followers, message] of cases) {
            const deps = pushDeps(jobOverride, followers)
            await expect(pushJobFollowersHandler(deps as never)(pushEvent)).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining(message) })
            expect(deps.productionJobRepository.commitPlacement).not.toHaveBeenCalled()
        }

        const missing = pushDeps()
        missing.productionJobRepository.getJobForForecast.mockResolvedValue(null)
        await expect(pushJobFollowersHandler(missing as never)(pushEvent)).rejects.toMatchObject({ statusCode: 404 })
    })

    it("takipçi bu arada taşınmışsa (sürüm çakışması) 409", async () => {
        vi.useFakeTimers({ now: new Date("2099-01-05T08:00:00Z"), toFake: ["Date"] })
        const deps = pushDeps()
        deps.productionJobRepository.commitPlacement.mockResolvedValue(null)
        await expect(pushJobFollowersHandler(deps as never)(pushEvent)).rejects.toMatchObject({ statusCode: 409 })
    })
})
