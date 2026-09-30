import { describe, expect, it, vi } from "vitest"
import { transpileSchema } from "@middy/validator/transpile"
import type { ValidateFunction } from "ajv"

import type { MoldDto } from "@/core/helpers/prisma/productionMolds/repository"
import type { VersionLabelDto } from "@/core/helpers/prisma/productionStats/repository"
import type { MoldStatsLotInput, OpenJobShotsInput } from "@/core/helpers/production/moldStats"
import { productionDateKey } from "@/core/helpers/production/productionTime"
import { moldStatsResponseValidator } from "@/functions/ProtectedApi/validators/productionStats"
import type { IGetMoldStatsEvent } from "@/functions/ProtectedApi/types/productionStats"
import { getMoldStatsHandler } from "./moldStats"

const MOLD_ID = "11111111-1111-4111-8111-111111111111"
const MACHINE_ID = "22222222-2222-4222-8222-222222222222"
const SIGNATURE = "color:c-1|materials:m-1"
const at = (iso: string) => new Date(iso)

// DTO tipleriyle yazılı fixture'lar: repository dönüşü değişirse burası derlenmez (şema kayması).
const mold: MoldDto = {
    id: MOLD_ID, code: "K-1", name: "Tapa kalıbı", status: "ACTIVE", ownership: "COMPANY", ownerCustomerId: null,
    requiredClampForceTon: null, widthMm: null, heightMm: null, thicknessMm: null, weightKg: null, requiredOpeningStrokeMm: null,
    locatingRingDiameterMm: null, hotRunnerZones: 0, coreCircuitsRequired: 0, requiresRobot: false, standardCycleTimeSec: 20,
    runnerWeightG: null, expectedScrapPercent: 2, setupMinutes: 60, totalShots: 90_000, maintenanceIntervalShots: 100_000,
    shotsAtLastMaintenance: 0, lastMaintenanceAt: at("2026-01-10T00:00:00Z"), storageLocation: null, notes: null,
    createdAt: at("2026-01-01T00:00:00Z"), updatedAt: at("2026-01-01T00:00:00Z"),
    outputs: [],
    machineProfiles: [{
        id: "33333333-3333-4333-8333-333333333333", machineId: MACHINE_ID, cycleTimeSec: 20, setupMinutes: null,
        isPreferred: true, isBlocked: false, notes: null, machine: { id: MACHINE_ID, code: "M-01", name: "Arburg" },
    }],
}
const lot = (start: string, end: string): MoldStatsLotInput => ({
    moldId: MOLD_ID, machineId: MACHINE_ID, machineCode: "M-01", versionSignature: SIGNATURE, plannedCycleSec: 20,
    actualStartAt: at(start), actualEndAt: at(end), actualShots: 1_050, stopMinutes: 60, goodQuantity: 2_050, scrapQuantity: 50,
})
const lots = [
    lot("2026-09-01T05:00:00Z", "2026-09-01T13:00:00Z"),
    lot("2026-09-01T13:00:00Z", "2026-09-01T21:00:00Z"),
    lot("2026-09-02T05:00:00Z", "2026-09-02T13:00:00Z"),
]
const openJobs: OpenJobShotsInput[] = [{ moldId: MOLD_ID, plannedShots: 20_000, reportedShots: 4_000 }]
const labels: VersionLabelDto[] = [{ signature: SIGNATURE, colorName: "Siyah", colorHex: "#111111", materials: ["PP"] }]

function buildDeps() {
    return {
        productionMoldRepository: { listMolds: vi.fn().mockResolvedValue([mold]) },
        productionStatsRepository: {
            listMoldStatsLots: vi.fn().mockResolvedValue(lots),
            listOpenJobShots: vi.fn().mockResolvedValue(openJobs),
            listVersionLabels: vi.fn().mockResolvedValue(labels),
        },
    }
}

const event = (query?: Record<string, string>) => ({ queryStringParameters: query }) as unknown as IGetMoldStatsEvent

type Payload = {
    range: { from: string; to: string }
    rows: Array<{
        code: string
        suggestionCount: number
        maintenance: { level: string; projectedLevel: string }
        machines: Array<{ machineCode: string; suggestion: { cycleTimeSec: number } | null }>
        versions: Array<{ colorName: string | null; materials: string[] }>
    }>
    summary: { suggestionCount: number; maintenanceAlertCount: number }
}

describe("getMoldStatsHandler", () => {
    it("hesap + öneri + renk / hammadde adı; GERÇEK çıktı yanıt şemasına uyar", async () => {
        const deps = buildDeps()
        const response = await getMoldStatsHandler(deps)(event({ from: "2026-09-01", to: "2026-09-30" }))

        const validate = transpileSchema(moldStatsResponseValidator) as unknown as ValidateFunction
        expect(validate(JSON.parse(JSON.stringify(response)))).toBe(true)
        expect(validate.errors ?? []).toEqual([])

        const payload = (response.body as unknown as { payload: Payload }).payload
        expect(payload.rows[0]).toMatchObject({
            code: "K-1",
            suggestionCount: 1,
            maintenance: { level: "SOON", projectedLevel: "DUE" },
            machines: [{ machineCode: "M-01", suggestion: { cycleTimeSec: 24 } }],
            versions: [{ colorName: "Siyah", materials: ["PP"] }],
        })
        expect(payload.summary).toMatchObject({ suggestionCount: 1, maintenanceAlertCount: 1 })
        expect(deps.productionStatsRepository.listMoldStatsLots).toHaveBeenCalledWith({ from: at("2026-08-31T21:00:00Z"), to: at("2026-09-30T21:00:00Z") })
        expect(deps.productionStatsRepository.listVersionLabels).toHaveBeenCalledWith([SIGNATURE])
    })

    it("varsayılan son 90 gün; ters ya da 3 yıldan uzun pencere 400", async () => {
        const deps = buildDeps()
        const response = await getMoldStatsHandler(deps)(event())
        const { range } = (response.body as unknown as { payload: Payload }).payload
        expect(range.to).toBe(productionDateKey(new Date()))
        const [{ from, to }] = deps.productionStatsRepository.listMoldStatsLots.mock.calls[0]
        expect(Math.round((to.getTime() - from.getTime()) / 86_400_000)).toBe(90)

        await expect(getMoldStatsHandler(buildDeps())(event({ from: "2026-09-30", to: "2026-09-01" }))).rejects.toMatchObject({ statusCode: 400 })
        await expect(getMoldStatsHandler(buildDeps())(event({ from: "2020-01-01", to: "2026-09-01" }))).rejects.toMatchObject({ statusCode: 400 })
    })
})
