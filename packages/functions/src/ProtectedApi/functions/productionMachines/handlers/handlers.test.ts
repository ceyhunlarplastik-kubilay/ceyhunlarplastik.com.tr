import { describe, expect, it, vi } from "vitest"
import { Prisma } from "@/prisma/generated/prisma/client"

import {
    createProductionMachineHandler,
    updateProductionMachineHandler,
} from "./index"
import { deleteProductionAreaHandler } from "@/functions/ProtectedApi/functions/productionAreas/handlers"
import type {
    ICreateProductionMachineEvent,
    IUpdateProductionMachineEvent,
} from "@/functions/ProtectedApi/types/productionMachines"
import type { IDeleteProductionAreaEvent } from "@/functions/ProtectedApi/types/productionAreas"

const AREA_ID = "33333333-3333-4333-8333-333333333333"
const MACHINE_ID = "44444444-4444-4444-8444-444444444444"

function buildDeps(options: { areaExists?: boolean; existingMachine?: Record<string, unknown> | null } = {}) {
    const { areaExists = true, existingMachine = null } = options
    return {
        productionMachineRepository: {
            getMachine: vi.fn().mockResolvedValue(existingMachine),
            createMachine: vi.fn().mockImplementation(async (input) => ({ id: MACHINE_ID, ...input })),
            updateMachine: vi.fn().mockImplementation(async (id, input) => ({ id, ...input })),
            deleteMachine: vi.fn(),
            listMachines: vi.fn(),
        },
        productionAreaRepository: {
            getArea: vi.fn().mockResolvedValue(areaExists ? { id: AREA_ID, machineCount: 0 } : null),
        },
        productionShiftPatternRepository: {
            getShiftPattern: vi.fn().mockResolvedValue(null),
        },
    }
}

const createEvent = (body: Record<string, unknown>) => ({ body }) as unknown as ICreateProductionMachineEvent
const updateEvent = (body: Record<string, unknown>) =>
    ({ body, pathParameters: { id: MACHINE_ID } }) as unknown as IUpdateProductionMachineEvent

describe("createProductionMachineHandler", () => {
    it("kodu normalleştirir ve eksik alanlara varsayılanları uygular", async () => {
        const deps = buildDeps()

        await createProductionMachineHandler(deps as never)(createEvent({
            code: " m-01 ",
            name: "Enjeksiyon 1",
            areaId: AREA_ID,
            clampForceTon: 120,
        }))

        const input = deps.productionMachineRepository.createMachine.mock.calls[0][0]
        expect(input.code).toBe("M-01")
        expect(input.status).toBe("ACTIVE")
        expect(input.plannedEfficiencyPercent).toBe(85)
        expect(input.minMoldHeightMm).toBeNull()
    })

    it("bilinmeyen alanı 404 ile reddeder", async () => {
        const deps = buildDeps({ areaExists: false })

        await expect(createProductionMachineHandler(deps as never)(createEvent({
            code: "M-01", name: "Enjeksiyon 1", areaId: AREA_ID, clampForceTon: 120,
        }))).rejects.toMatchObject({ statusCode: 404 })
    })

    it("aynı kodu 409'a çevirir", async () => {
        const deps = buildDeps()
        deps.productionMachineRepository.createMachine.mockRejectedValue(
            new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "7" }),
        )

        await expect(createProductionMachineHandler(deps as never)(createEvent({
            code: "M-01", name: "Enjeksiyon 1", areaId: AREA_ID, clampForceTon: 120,
        }))).rejects.toMatchObject({ statusCode: 409 })
    })
})

describe("updateProductionMachineHandler — kısmi güncellemede min ≤ maks", () => {
    it("yalnız minimum gönderilse de kayıttaki maksimumla karşılaştırır", async () => {
        const deps = buildDeps({ existingMachine: { id: MACHINE_ID, code: "M-01", minMoldHeightMm: 150, maxMoldHeightMm: 300 } })

        await expect(
            updateProductionMachineHandler(deps as never)(updateEvent({ minMoldHeightMm: 400 })),
        ).rejects.toMatchObject({ statusCode: 400 })
        expect(deps.productionMachineRepository.updateMachine).not.toHaveBeenCalled()
    })

    it("yalnız plaka açıklığı gönderilse de kayıttaki maksimum kalınlıkla karşılaştırır", async () => {
        // Arburg 320 C'ye "maks. kalınlık 550" girilmişse, açıklık 550 eklenince uyarı verilmeli.
        const deps = buildDeps({ existingMachine: { id: MACHINE_ID, code: "M-01", minMoldHeightMm: 200, maxMoldHeightMm: 550 } })

        await expect(
            updateProductionMachineHandler(deps as never)(updateEvent({ maxDaylightMm: 550 })),
        ).rejects.toMatchObject({ statusCode: 400 })

        await updateProductionMachineHandler(deps as never)(updateEvent({ maxDaylightMm: 550, maxMoldHeightMm: null }))
        expect(deps.productionMachineRepository.updateMachine).toHaveBeenCalledWith(MACHINE_ID, {
            maxDaylightMm: 550,
            maxMoldHeightMm: null,
        })
    })

    it("maksimum temizlenince (null) kural uygulanmaz", async () => {
        const deps = buildDeps({ existingMachine: { id: MACHINE_ID, code: "M-01", minMoldHeightMm: 150, maxMoldHeightMm: 300 } })

        await updateProductionMachineHandler(deps as never)(updateEvent({ minMoldHeightMm: 400, maxMoldHeightMm: null }))

        expect(deps.productionMachineRepository.updateMachine).toHaveBeenCalledWith(MACHINE_ID, {
            minMoldHeightMm: 400,
            maxMoldHeightMm: null,
        })
    })
})

describe("deleteProductionAreaHandler", () => {
    it("makinesi olan alan silinemez", async () => {
        const repository = {
            getArea: vi.fn().mockResolvedValue({ id: AREA_ID, machineCount: 3 }),
            deleteArea: vi.fn(),
        }

        await expect(
            deleteProductionAreaHandler({ productionAreaRepository: repository } as never)(
                { pathParameters: { id: AREA_ID } } as unknown as IDeleteProductionAreaEvent,
            ),
        ).rejects.toMatchObject({ statusCode: 409 })
        expect(repository.deleteArea).not.toHaveBeenCalled()
    })
})

describe("iş koruması (Dilim 2.3)", () => {
    it("planlı işi olan makine silinemez", async () => {
        const { deleteProductionMachineHandler } = await import("./index")
        const repository = {
            getMachine: vi.fn().mockResolvedValue({ id: MACHINE_ID, code: "M-01" }),
            countJobs: vi.fn().mockResolvedValue(2),
            deleteMachine: vi.fn(),
        }
        await expect(deleteProductionMachineHandler({ productionMachineRepository: repository } as never)(
            { pathParameters: { id: MACHINE_ID } } as never,
        )).rejects.toMatchObject({ statusCode: 409 })
        expect(repository.deleteMachine).not.toHaveBeenCalled()
    })

    it("işi olan kalıp silinemez; işe bağlı göz grubu çıkarılamaz", async () => {
        const { deleteMoldHandler, updateMoldHandler } = await import("@/functions/ProtectedApi/functions/productionMolds/handlers")
        const moldRepository = {
            getMold: vi.fn().mockResolvedValue({ id: "k", code: "K-1001", totalShots: 0, shotsAtLastMaintenance: 0 }),
            countJobs: vi.fn().mockResolvedValue(1),
            countJobOutputsOnRemovedOutputs: vi.fn().mockResolvedValue(1),
            deleteMold: vi.fn(),
            updateMold: vi.fn(),
        }
        const deps = {
            productionMoldRepository: moldRepository,
            productionReferenceRepository: {
                findExistingProductSizeIds: vi.fn().mockResolvedValue(new Set(["s1"])),
                findMoldAssignableProductSizeIds: vi.fn().mockResolvedValue(new Set(["s1"])),
            },
            productionMachineRepository: { findExistingMachineIds: vi.fn().mockResolvedValue(new Set()) },
        }

        await expect(deleteMoldHandler(deps as never)({ pathParameters: { id: "k" } } as never))
            .rejects.toMatchObject({ statusCode: 409 })
        await expect(updateMoldHandler(deps as never)({
            pathParameters: { id: "k" },
            body: { outputs: [{ productSizeId: "s1", cavities: 4, partWeightG: null }] },
        } as never)).rejects.toMatchObject({ statusCode: 409 })
        expect(moldRepository.countJobOutputsOnRemovedOutputs).toHaveBeenCalledWith("k", ["s1"])
        expect(moldRepository.updateMold).not.toHaveBeenCalled()
    })
})
