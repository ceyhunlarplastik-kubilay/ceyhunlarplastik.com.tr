import { describe, expect, it, vi } from "vitest"
import { transpileSchema } from "@middy/validator/transpile"
import type { ValidateFunction } from "ajv"

import { createMoldHandler, recordMoldMaintenanceHandler, setMoldMachineCycleHandler, updateMoldHandler } from "./index"
import { upsertMaterialProfileHandler } from "@/functions/ProtectedApi/functions/productionMaterialProfiles/handlers"
import { setMoldMachineCycleResponseValidator } from "@/functions/ProtectedApi/validators/productionMolds"
import type {
    ICreateMoldEvent,
    IRecordMoldMaintenanceEvent,
    ISetMoldMachineCycleEvent,
    IUpdateMoldEvent,
} from "@/functions/ProtectedApi/types/productionMolds"
import { productionDateKey } from "@/core/helpers/production/productionTime"
import type { IUpsertMaterialProfileEvent } from "@/functions/ProtectedApi/types/productionMaterialProfiles"

const MOLD_ID = "77777777-7777-4777-8777-777777777777"
const SIZE_A = "66666666-6666-4666-8666-666666666666"
const SIZE_B = "66666666-6666-4666-8666-666666666667"
const MACHINE_ID = "44444444-4444-4444-8444-444444444444"

function buildDeps(options: { knownSizes?: string[]; assignableSizes?: string[]; existingMold?: Record<string, unknown> | null; missingMold?: boolean } = {}) {
    const { knownSizes = [SIZE_A, SIZE_B], existingMold = null } = options
    const assignableSizes = options.assignableSizes ?? knownSizes
    return {
        productionMoldRepository: {
            getMold: vi.fn().mockResolvedValue(existingMold),
            createMold: vi.fn().mockImplementation(async (input) => ({ id: MOLD_ID, ...input })),
            updateMold: vi.fn().mockImplementation(async (id, input) => ({ id, ...input })),
            deleteMold: vi.fn(),
            listMolds: vi.fn(),
            recordMaintenance: vi.fn().mockImplementation(async (id, performedAt) => ({ id, lastMaintenanceAt: performedAt })),
            setMachineProfileCycle: vi.fn().mockResolvedValue(options.missingMold ? null : { created: true }),
        },
        productionReferenceRepository: {
            findExistingProductSizeIds: vi.fn().mockResolvedValue(new Set(knownSizes)),
            findMoldAssignableProductSizeIds: vi.fn().mockResolvedValue(new Set(assignableSizes)),
        },
        productionMachineRepository: {
            findExistingMachineIds: vi.fn().mockResolvedValue(new Set([MACHINE_ID])),
        },
    }
}

const createEvent = (body: Record<string, unknown>) => ({ body }) as unknown as ICreateMoldEvent
const updateEvent = (body: Record<string, unknown>) =>
    ({ body, pathParameters: { id: MOLD_ID } }) as unknown as IUpdateMoldEvent

describe("createMoldHandler", () => {
    it("aile kalıbını (iki ölçü) varsayılanlarla ve normalleştirilmiş kodla yazar", async () => {
        const deps = buildDeps()

        await createMoldHandler(deps as never)(createEvent({
            code: " k-1045 ",
            name: "Aile kalıbı",
            standardCycleTimeSec: 22.5,
            outputs: [
                { productSizeId: SIZE_A, cavities: 2 },
                { productSizeId: SIZE_B, cavities: 4, partWeightG: 8 },
            ],
            machineProfiles: [{ machineId: MACHINE_ID, isPreferred: true }],
        }))

        const [input, outputs, profiles] = deps.productionMoldRepository.createMold.mock.calls[0]
        expect(input.code).toBe("K-1045")
        expect(input.setupMinutes).toBe(60)
        expect(outputs).toEqual([
            { productSizeId: SIZE_A, cavities: 2, partWeightG: null },
            { productSizeId: SIZE_B, cavities: 4, partWeightG: 8 },
        ])
        expect(profiles[0]).toMatchObject({ machineId: MACHINE_ID, isPreferred: true, isBlocked: false })
    })

    it("aynı ölçüyü iki satırda 400, bilinmeyen ölçüyü 404 ile reddeder", async () => {
        await expect(createMoldHandler(buildDeps() as never)(createEvent({
            code: "K-1", name: "K", standardCycleTimeSec: 20,
            outputs: [{ productSizeId: SIZE_A, cavities: 2 }, { productSizeId: SIZE_A, cavities: 2 }],
        }))).rejects.toMatchObject({ statusCode: 400 })

        await expect(createMoldHandler(buildDeps({ knownSizes: [SIZE_A] }) as never)(createEvent({
            code: "K-1", name: "K", standardCycleTimeSec: 20,
            outputs: [{ productSizeId: SIZE_B, cavities: 2 }],
        }))).rejects.toMatchObject({ statusCode: 404 })
    })

    it("iç üretim olmayan ölçü kalıba bağlanamaz", async () => {
        const deps = buildDeps({ assignableSizes: [SIZE_A] })
        await expect(createMoldHandler(deps as never)(createEvent({
            code: "K-1", name: "K", standardCycleTimeSec: 20,
            outputs: [{ productSizeId: SIZE_A, cavities: 2 }, { productSizeId: SIZE_B, cavities: 2 }],
        }))).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining("iç üretim") })
        expect(deps.productionMoldRepository.createMold).not.toHaveBeenCalled()
    })

    it("hem tercih hem engelli makine kartını reddeder", async () => {
        await expect(createMoldHandler(buildDeps() as never)(createEvent({
            code: "K-1", name: "K", standardCycleTimeSec: 20,
            machineProfiles: [{ machineId: MACHINE_ID, isPreferred: true, isBlocked: true }],
        }))).rejects.toMatchObject({ statusCode: 400 })
    })
})

describe("updateMoldHandler", () => {
    it("liste gönderilmezse göz gruplarına ve kartlara dokunmaz", async () => {
        const deps = buildDeps({ existingMold: { id: MOLD_ID, code: "K-1", totalShots: 10, shotsAtLastMaintenance: 0 } })

        await updateMoldHandler(deps as never)(updateEvent({ name: "Yeni ad" }))

        const [, input, outputs, profiles] = deps.productionMoldRepository.updateMold.mock.calls[0]
        expect(input).toEqual({ name: "Yeni ad" })
        expect(outputs).toBeUndefined()
        expect(profiles).toBeUndefined()
    })

    it("son bakım sayacını kayıttaki toplamla karşılaştırır", async () => {
        const deps = buildDeps({ existingMold: { id: MOLD_ID, code: "K-1", totalShots: 100, shotsAtLastMaintenance: 0 } })

        await expect(
            updateMoldHandler(deps as never)(updateEvent({ shotsAtLastMaintenance: 500 })),
        ).rejects.toMatchObject({ statusCode: 400 })
    })
})

describe("upsertMaterialProfileHandler", () => {
    it("kurutma gerekmiyorsa kurutma değerlerini temizler, aileyi büyük harfe çevirir", async () => {
        const repository = {
            getMaterialWithProfile: vi.fn().mockResolvedValue({ id: "m", name: "PP", code: "PP", profile: null }),
            upsertProfile: vi.fn().mockImplementation(async (id, input) => ({ id, profile: input })),
            listMaterialsWithProfiles: vi.fn(),
        }

        await upsertMaterialProfileHandler({ productionMaterialProfileRepository: repository } as never)({
            pathParameters: { materialId: "m" },
            body: { isMoldResin: true, family: " pa6 gf30 ", requiresDrying: false, dryingTempC: 80, dryingHours: 4, cycleTimeFactor: 1.1 },
        } as unknown as IUpsertMaterialProfileEvent)

        expect(repository.upsertProfile.mock.calls[0][1]).toMatchObject({
            family: "PA6 GF30",
            dryingTempC: null,
            dryingHours: null,
            cycleTimeFactor: 1.1,
        })
    })
})

describe("recordMoldMaintenanceHandler", () => {
    const maintenanceEvent = (body: Record<string, unknown>) =>
        ({ body, pathParameters: { id: MOLD_ID } }) as unknown as IRecordMoldMaintenanceEvent

    it("bakım GÜNÜ fabrika saatiyle yazılır (kalıp formuyla aynı sözleşme: gün, UTC gece yarısı)", async () => {
        const deps = buildDeps()
        await recordMoldMaintenanceHandler(deps as never)(maintenanceEvent({}))
        const [id, performedAt] = deps.productionMoldRepository.recordMaintenance.mock.calls[0]
        expect(id).toBe(MOLD_ID)
        expect(performedAt.toISOString()).toBe(`${productionDateKey(new Date())}T00:00:00.000Z`)

        // 05.01 23:30 (TR) = 05.01 20:30Z; 06.01 01:30 (TR) = 05.01 22:30Z → fabrika günü 06.01.
        await recordMoldMaintenanceHandler(deps as never)(maintenanceEvent({ performedAt: "2026-01-05T20:30:00.000Z" }))
        await recordMoldMaintenanceHandler(deps as never)(maintenanceEvent({ performedAt: "2026-01-05T22:30:00.000Z" }))
        expect(deps.productionMoldRepository.recordMaintenance.mock.calls.slice(1).map((call) => call[1].toISOString())).toEqual([
            "2026-01-05T00:00:00.000Z",
            "2026-01-06T00:00:00.000Z",
        ])
    })

    it("gelecekteki bakım anı 400, bilinmeyen kalıp 404", async () => {
        const deps = buildDeps()
        const future = new Date(Date.now() + 60 * 60_000).toISOString()
        await expect(recordMoldMaintenanceHandler(deps as never)(maintenanceEvent({ performedAt: future })))
            .rejects.toMatchObject({ statusCode: 400 })
        expect(deps.productionMoldRepository.recordMaintenance).not.toHaveBeenCalled()

        deps.productionMoldRepository.recordMaintenance.mockResolvedValue(null)
        await expect(recordMoldMaintenanceHandler(deps as never)(maintenanceEvent({}))).rejects.toMatchObject({ statusCode: 404 })
    })
})

describe("setMoldMachineCycleHandler", () => {
    const cycleEvent = (machineId: string, cycleTimeSec: number) =>
        ({ body: { cycleTimeSec }, pathParameters: { id: MOLD_ID, machineId } }) as unknown as ISetMoldMachineCycleEvent

    it("öneriyi karta yazar (kart yoksa oluşur); yanıt şemaya uyar", async () => {
        const deps = buildDeps()
        const response = await setMoldMachineCycleHandler(deps as never)(cycleEvent(MACHINE_ID, 24.3))
        expect(deps.productionMoldRepository.setMachineProfileCycle).toHaveBeenCalledWith(MOLD_ID, MACHINE_ID, 24.3)
        const validate = transpileSchema(setMoldMachineCycleResponseValidator) as unknown as ValidateFunction
        expect(validate(JSON.parse(JSON.stringify(response)))).toBe(true)
        expect((response.body as unknown as { payload: unknown }).payload).toEqual({ moldId: MOLD_ID, machineId: MACHINE_ID, cycleTimeSec: 24.3, created: true })
    })

    it("bilinmeyen makine 400, bilinmeyen kalıp 404", async () => {
        const unknownMachine = "44444444-4444-4444-8444-444444444449"
        const deps = buildDeps()
        await expect(setMoldMachineCycleHandler(deps as never)(cycleEvent(unknownMachine, 24))).rejects.toMatchObject({ statusCode: 400 })
        expect(deps.productionMoldRepository.setMachineProfileCycle).not.toHaveBeenCalled()
        await expect(setMoldMachineCycleHandler(buildDeps({ missingMold: true }) as never)(cycleEvent(MACHINE_ID, 24))).rejects.toMatchObject({ statusCode: 404 })
    })
})
