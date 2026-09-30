import { describe, expect, it, vi } from "vitest"

import {
    createDefaultProductionReasonsHandler,
    createProductionReasonHandler,
    deleteProductionReasonHandler,
    updateProductionReasonHandler,
} from "./index"
import { DEFAULT_PRODUCTION_REASONS } from "@/core/helpers/production/productionReasons"
import type {
    ICreateProductionReasonEvent,
    IDeleteProductionReasonEvent,
    IUpdateProductionReasonEvent,
} from "@/functions/ProtectedApi/types/productionReasons"

const reason = { id: "r1", kind: "STOP", code: "D01", name: "Kalıp arızası", stopCategory: "BREAKDOWN", isActive: true, sortOrder: 0, usageCount: 0 }

function buildDeps() {
    return {
        productionReasonRepository: {
            listReasons: vi.fn().mockResolvedValue([reason]),
            getReason: vi.fn().mockResolvedValue(reason),
            codeTaken: vi.fn().mockResolvedValue(false),
            createReason: vi.fn().mockImplementation(async (input) => ({ id: "new", usageCount: 0, ...input })),
            updateReason: vi.fn().mockImplementation(async (id, input) => ({ ...reason, id, ...input })),
            deleteReason: vi.fn(),
            createMany: vi.fn().mockImplementation(async (inputs: unknown[]) => inputs.length),
        },
    }
}

describe("neden sözlüğü uçları", () => {
    it("kod büyük harfe normalleşir; duruşta kategori zorunlu; tekrar eden kod 409", async () => {
        const deps = buildDeps()
        const create = (body: Record<string, unknown>) => createProductionReasonHandler(deps as never)({ body } as unknown as ICreateProductionReasonEvent)

        await create({ kind: "SCRAP", code: " f11 ", name: " Hava kabarcığı " })
        expect(deps.productionReasonRepository.createReason).toHaveBeenCalledWith({
            kind: "SCRAP", code: "F11", name: "Hava kabarcığı", stopCategory: null, isActive: true, sortOrder: 0,
        })
        await expect(create({ kind: "STOP", code: "D20", name: "x" })).rejects.toMatchObject({ statusCode: 400 })
        deps.productionReasonRepository.codeTaken.mockResolvedValue(true)
        await expect(create({ kind: "STOP", code: "D01", name: "x", stopCategory: "OTHER" })).rejects.toMatchObject({ statusCode: 409 })
    })

    it("düzenlemede tür değişmez, kategori kuralı birleşik değere uygulanır", async () => {
        const deps = buildDeps()
        const update = (body: Record<string, unknown>) => updateProductionReasonHandler(deps as never)({ pathParameters: { id: "r1" }, body } as unknown as IUpdateProductionReasonEvent)
        await update({ isActive: false })
        expect(deps.productionReasonRepository.updateReason).toHaveBeenCalledWith("r1", expect.objectContaining({ isActive: false, stopCategory: "BREAKDOWN" }))
        await expect(update({ stopCategory: null })).rejects.toMatchObject({ statusCode: 400 })
    })

    it("kullanılan neden silinmez (409); kullanılmayan silinir", async () => {
        const deps = buildDeps()
        const remove = () => deleteProductionReasonHandler(deps as never)({ pathParameters: { id: "r1" } } as unknown as IDeleteProductionReasonEvent)
        deps.productionReasonRepository.getReason.mockResolvedValue({ ...reason, usageCount: 2 })
        await expect(remove()).rejects.toMatchObject({ statusCode: 409 })
        deps.productionReasonRepository.getReason.mockResolvedValue(reason)
        await remove()
        expect(deps.productionReasonRepository.deleteReason).toHaveBeenCalledWith("r1")
    })

    it("varsayılanlar yalnız eksik olanları ekler", async () => {
        const deps = buildDeps()
        const response = await createDefaultProductionReasonsHandler(deps as never)({} as never)
        const [inputs] = deps.productionReasonRepository.createMany.mock.calls[0]
        expect(inputs).toHaveLength(DEFAULT_PRODUCTION_REASONS.length - 1)
        expect(inputs.every((input: { isActive: boolean }) => input.isActive)).toBe(true)
        expect((response.body as unknown as { payload: { created: number } }).payload.created).toBe(DEFAULT_PRODUCTION_REASONS.length - 1)
    })
})
