import { describe, expect, it, vi } from "vitest"

import type {
    IListProductionVariantsEvent,
    IUpsertProductionVariantProfileEvent,
} from "@/functions/ProtectedApi/types/productionVariantProfiles"
import { listProductionVariantsHandler, upsertProductionVariantProfileHandler } from "./index"

const VARIANT_ID = "33333333-3333-4333-8333-333333333333"

function buildDeps(inHouse = true) {
    const variant = { id: VARIANT_ID, fullCode: "10.5.8.V1", cycleTimeSec: null }
    return {
        productionVariantProfileRepository: {
            listVariants: vi.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } }),
            getVariant: vi.fn().mockResolvedValue(inHouse ? variant : null),
            setCycleTime: vi.fn().mockImplementation(async (id, cycleTimeSec) => ({ ...variant, id, cycleTimeSec })),
        },
    }
}

const upsertEvent = (cycleTimeSec: number | null) =>
    ({ pathParameters: { variantId: VARIANT_ID }, body: { cycleTimeSec } }) as unknown as IUpsertProductionVariantProfileEvent

describe("üretim varyantları", () => {
    it("liste sayfa ve boyutu sınırlar, aramayı iletir", async () => {
        const deps = buildDeps()
        await listProductionVariantsHandler(deps as never)({ queryStringParameters: { page: "0", limit: "500", q: "10.5" } } as unknown as IListProductionVariantsEvent)
        expect(deps.productionVariantProfileRepository.listVariants).toHaveBeenCalledWith({ page: 1, limit: 100, search: "10.5" })
    })

    it("çevrim yazılır; null çevrimi kaldırır", async () => {
        const deps = buildDeps()
        await upsertProductionVariantProfileHandler(deps as never)(upsertEvent(18.5))
        expect(deps.productionVariantProfileRepository.setCycleTime).toHaveBeenCalledWith(VARIANT_ID, 18.5)

        await upsertProductionVariantProfileHandler(deps as never)(upsertEvent(null))
        expect(deps.productionVariantProfileRepository.setCycleTime).toHaveBeenLastCalledWith(VARIANT_ID, null)
    })

    it("iç üretim olmayan varyant 404 alır ve yazılmaz", async () => {
        const deps = buildDeps(false)
        await expect(upsertProductionVariantProfileHandler(deps as never)(upsertEvent(18))).rejects.toMatchObject({ statusCode: 404 })
        expect(deps.productionVariantProfileRepository.setCycleTime).not.toHaveBeenCalled()
    })
})
