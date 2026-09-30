import { describe, expect, it } from "vitest"

import { formatWorkMinutes } from "@core/helpers/production/productionTime"
import { jobCalendarDays, jobWorkMinutes } from "./jobDurations"

describe("iş süreleri", () => {
    it("çalışma süresi planlama motorunun formülüyle: 20.000 adet · 4 göz · 20 sn · %2 fire · %85 verim · 45 dk bağlama", () => {
        // 5.103 baskı (20.000 ÷ 3,92) × 20 sn ÷ 0,85 = 2.001 dk üretim + 45 dk bağlama.
        const work = jobWorkMinutes({ setupMinutes: 45, plannedShots: 5_103, cycleTimeSec: 20, efficiencyPercent: 85 })
        expect(work.productionMinutes).toBeCloseTo(2_001.18, 1)
        expect(formatWorkMinutes(work.totalMinutes)).toBe("34 sa 6 dk")
    })

    it("takvimde kapladığı fabrika günleri: 30.09 08:00 → 02.10 18:06 = 3 gün; gece yarısı biten iş ertesi günü saymaz", () => {
        expect(jobCalendarDays("2026-09-30T05:00:00.000Z", "2026-10-02T15:06:00.000Z")).toEqual({ from: "2026-09-30", to: "2026-10-02", days: 3 })
        expect(jobCalendarDays("2026-09-30T05:00:00.000Z", "2026-09-30T21:00:00.000Z")).toEqual({ from: "2026-09-30", to: "2026-09-30", days: 1 })
        expect(jobCalendarDays("2026-09-30T05:00:00.000Z", "2026-09-30T05:00:00.000Z").days).toBe(1)
    })
})
