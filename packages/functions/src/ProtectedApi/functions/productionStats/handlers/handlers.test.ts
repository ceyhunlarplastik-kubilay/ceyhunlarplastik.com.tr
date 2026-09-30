import { describe, expect, it, vi } from "vitest"
import { transpileSchema } from "@middy/validator/transpile"
import type { ValidateFunction } from "ajv"

import type { ReferenceProductSizesDto, VariantVersionDto } from "@/core/helpers/prisma/productionReferences/repository"
import type { StatsJobInput } from "@/core/helpers/production/productionStats"
import { productionDateKey } from "@/core/helpers/production/productionTime"
import { productHistoryResponseValidator } from "@/functions/ProtectedApi/validators/productionStats"
import type { IGetProductHistoryEvent } from "@/functions/ProtectedApi/types/productionStats"
import { getProductHistoryHandler } from "./index"

const PRODUCT_ID = "11111111-1111-4111-8111-111111111111"
const SIZE_A = "22222222-2222-4222-8222-222222222222"
const SIZE_B = "22222222-2222-4222-8222-222222222223"

// DTO tipleriyle yazılı fixture'lar: repository dönüşü değişirse burası derlenmez (şema kayması).
const catalog: ReferenceProductSizesDto = {
    product: { id: PRODUCT_ID, code: "10.1", name: "Kare tapa" },
    sizes: [
        { id: SIZE_A, code: 1, sizeCode: "10.1.1", label: "Çap: 10 mm", variantCount: 2, moldCount: 1 },
        { id: SIZE_B, code: 2, sizeCode: "10.1.2", label: "Çap: 12 mm", variantCount: 1, moldCount: 1 },
    ],
}
const versions: VariantVersionDto[] = [
    { code: "V1", colorName: "Siyah", colorHex: "#111111", materials: ["PP"], materialIds: ["m-1"], signature: "color:k|materials:pp" },
]
const at = (iso: string) => new Date(iso)
const job: StatsJobInput = {
    id: "33333333-3333-4333-8333-333333333333",
    lotBaseNumber: 1000,
    status: "COMPLETED",
    versionSignature: "color:k|materials:pp",
    machineCode: "M-01",
    moldCode: "K-1",
    productionStartAt: at("2026-09-01T05:00:00Z"),
    plannedEndAt: at("2026-09-01T21:00:00Z"),
    plannedShots: 2_400,
    cycleTimeSec: 20,
    efficiencyPercent: 85,
    outputs: [
        { id: "44444444-4444-4444-8444-444444444444", productSizeId: SIZE_A, cavities: 2, plannedQuantity: 4_800, goodQuantity: 4_750, scrapQuantity: 50, order: { orderNumber: "UE-1001", variantCode: "10.1.1.V1" } },
        { id: "44444444-4444-4444-8444-444444444445", productSizeId: SIZE_B, cavities: 2, plannedQuantity: 4_800, goodQuantity: 4_800, scrapQuantity: 0, order: null },
    ],
    lots: [{ status: "COMPLETED", actualStartAt: at("2026-09-01T05:10:00Z"), actualEndAt: at("2026-09-01T21:00:00Z"), actualShots: 2_380, reported: true, stopMinutes: 30, outputs: [] }],
}

function buildDeps(overrides: { catalog?: ReferenceProductSizesDto | null; jobs?: StatsJobInput[] } = {}) {
    return {
        productionReferenceRepository: { getProductSizes: vi.fn().mockResolvedValue(overrides.catalog === undefined ? catalog : overrides.catalog) },
        productionStatsRepository: {
            listProductVersions: vi.fn().mockResolvedValue(versions),
            listProductHistoryJobs: vi.fn().mockResolvedValue({ jobs: overrides.jobs ?? [job], truncated: false }),
        },
    }
}

const event = (query: Record<string, string>) => ({ queryStringParameters: { productId: PRODUCT_ID, ...query } }) as unknown as IGetProductHistoryEvent

describe("getProductHistoryHandler", () => {
    it("varsayılan son 12 ay; tüm ölçüler; GERÇEK çıktı yanıt şemasına uyar", async () => {
        const deps = buildDeps()
        const response = await getProductHistoryHandler(deps as never)(event({}))

        const validate = transpileSchema(productHistoryResponseValidator) as unknown as ValidateFunction
        expect(validate(JSON.parse(JSON.stringify(response)))).toBe(true)
        expect(validate.errors ?? []).toEqual([])

        const [query] = deps.productionStatsRepository.listProductHistoryJobs.mock.calls[0]
        expect(query.productSizeIds).toEqual([SIZE_A, SIZE_B])
        expect(query.versionSignature).toBeNull()
        const payload = (response.body as unknown as { payload: { range: { from: string; to: string }; rows: Array<{ size: { sizeCode: string }; version: { code: string } | null }>; summary: { jobCount: number } } }).payload
        expect(payload.range.to).toBe(productionDateKey(new Date()))
        expect(payload.rows.map((row) => [row.size.sizeCode, row.version?.code])).toEqual([["10.1.1", "V1"], ["10.1.2", "V1"]])
        expect(payload.summary.jobCount).toBe(1)
        // Süzgeç seçenekleri aynı yanıtta.
        expect((response.body as unknown as { payload: { sizes: unknown[]; versions: Array<{ signature: string }> } }).payload).toMatchObject({
            sizes: [{ id: SIZE_A, sizeCode: "10.1.1" }, { id: SIZE_B, sizeCode: "10.1.2" }],
            versions: [{ signature: "color:k|materials:pp", code: "V1" }],
        })
    })

    it("ölçü ve versiyon süzgeci; pencere fabrika gece yarısından", async () => {
        const deps = buildDeps()
        await getProductHistoryHandler(deps as never)(event({ sizeId: SIZE_B, version: "color:k|materials:pp", from: "2026-09-01", to: "2026-09-30" }))
        expect(deps.productionStatsRepository.listProductHistoryJobs).toHaveBeenCalledWith({
            productSizeIds: [SIZE_B],
            versionSignature: "color:k|materials:pp",
            from: new Date("2026-08-31T21:00:00.000Z"),
            to: new Date("2026-09-30T21:00:00.000Z"),
        })
    })

    it("bilinmeyen ürün 404; başka ürünün ölçüsü ve bozuk pencere 400", async () => {
        await expect(getProductHistoryHandler(buildDeps({ catalog: null }) as never)(event({}))).rejects.toMatchObject({ statusCode: 404 })
        await expect(getProductHistoryHandler(buildDeps() as never)(event({ sizeId: "99999999-9999-4999-8999-999999999999" }))).rejects.toMatchObject({ statusCode: 400 })
        await expect(getProductHistoryHandler(buildDeps() as never)(event({ from: "2026-10-01", to: "2026-09-01" }))).rejects.toMatchObject({ statusCode: 400 })
    })
})
