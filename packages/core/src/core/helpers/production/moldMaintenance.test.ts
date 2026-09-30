import { describe, expect, it } from "vitest"

import { isMaintenanceAlert, moldMaintenanceStatus } from "./moldMaintenance"

describe("kalıp bakım durumu", () => {
    const mold = { totalShots: 145_000, maintenanceIntervalShots: 100_000, shotsAtLastMaintenance: 50_000 }

    it("aralık yoksa izlenmez", () => {
        expect(moldMaintenanceStatus({ ...mold, maintenanceIntervalShots: null })).toMatchObject({ level: "NONE", projectedLevel: "NONE", remainingShots: null })
    })

    it("%85 yaklaşıyor, %100 geldi; planlı baskılarla öngörü", () => {
        expect(moldMaintenanceStatus({ ...mold, totalShots: 130_000 })).toMatchObject({ level: "OK", shotsSinceMaintenance: 80_000, remainingShots: 20_000 })
        expect(moldMaintenanceStatus({ ...mold, totalShots: 135_000 }).level).toBe("SOON")
        expect(moldMaintenanceStatus({ ...mold, totalShots: 150_000 }).level).toBe("DUE")
        const soon = moldMaintenanceStatus(mold, 10_000)
        expect(soon).toMatchObject({ level: "SOON", projectedLevel: "DUE", remainingShots: 5_000 })
        expect(isMaintenanceAlert(soon)).toBe(true)
        expect(moldMaintenanceStatus({ ...mold, totalShots: 151_000 })).toMatchObject({ level: "DUE", remainingShots: -1_000 })
        expect(isMaintenanceAlert(moldMaintenanceStatus({ ...mold, totalShots: 120_000 }, 5_000))).toBe(false)
    })
})
