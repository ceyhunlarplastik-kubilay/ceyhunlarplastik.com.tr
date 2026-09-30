import { describe, expect, it } from "vitest"

import type { JobForecast } from "./jobForecast"
import { moldMaintenanceStatus } from "./moldMaintenance"
import {
    alertDeliveryKey,
    jobAlerts,
    moldAlerts,
    pendingAlertDeliveries,
    realtimeAlertSummary,
    type AlertJobInput,
} from "./productionAlerts"

const job: AlertJobInput = {
    id: "j-1",
    lotBaseNumber: 1000,
    machineCode: "M-01",
    // 28.09 08:00 (TR)
    setupStartAt: new Date("2026-09-28T05:00:00.000Z"),
    plannedEndAt: new Date("2026-09-28T10:00:00.000Z"),
    order: { orderNumber: "UE-1001", variantCode: "10.1.3.V1", dueDate: "2026-09-29" },
}

const forecast = (override: Partial<JobForecast> = {}): JobForecast => ({
    state: "BEHIND",
    progress: 0.4,
    reportedShots: 400,
    remainingShots: 600,
    projectedEndAt: new Date("2026-09-28T11:30:00.000Z"),
    delayMinutes: 90,
    dueRisk: false,
    ...override,
})

describe("iş uyarıları", () => {
    it("gecikme: anahtar planlı bitişi taşır; başlık durum, mesaj makine · emir · tahmini bitiş; iş tahtada açılır", () => {
        expect(jobAlerts(job, forecast())).toEqual([{
            key: "job:j-1:late:2026-09-28T10:00:00.000Z",
            kind: "JOB_LATE",
            title: "Geride · İş 1000",
            message: "M-01 · UE-1001 · 10.1.3.V1 — tahmini bitiş 28.09 14:30 (+1 sa 30 dk)",
            href: "/uretim/tahta?bas=2026-09-28&is=1000",
        }])
        expect(jobAlerts(job, forecast({ state: "NOT_STARTED" }))[0].title).toBe("Başlamadı · İş 1000")
        expect(jobAlerts(job, forecast({ state: "OVERDUE" }))[0].title).toBe("Süresi geçti · İş 1000")
        expect(jobAlerts(job, forecast({ state: "OVERDUE", projectedEndAt: null, delayMinutes: null }))[0].message).toBe("M-01 · UE-1001 · 10.1.3.V1 — tahmini bitiş hesaplanamadı")
    })

    it("plana uygun / üretimi bitmiş iş uyarı üretmez; plan değişince yeni anahtar", () => {
        expect(jobAlerts(job, forecast({ state: "ON_TRACK", delayMinutes: 10 }))).toEqual([])
        expect(jobAlerts(job, forecast({ state: "PRODUCED" }))).toEqual([])
        const moved = jobAlerts({ ...job, plannedEndAt: new Date("2026-09-28T12:00:00.000Z") }, forecast())[0].key
        expect(moved).not.toBe(jobAlerts(job, forecast())[0].key)
    })

    it("termin riski ayrı uyarı ve ayrı anahtar (termin değişirse yeniden); terminsiz emirde yok", () => {
        const alerts = jobAlerts(job, forecast({ state: "ON_TRACK", delayMinutes: 0, dueRisk: true }))
        expect(alerts).toEqual([expect.objectContaining({
            key: "job:j-1:due:2026-09-29",
            kind: "JOB_DUE_RISK",
            title: "Termin riski · İş 1000",
            message: "UE-1001 termini 29.09.2026; tahmini bitiş 28.09 14:30",
        })])
        expect(jobAlerts(job, forecast({ dueRisk: true })).map((alert) => alert.kind)).toEqual(["JOB_LATE", "JOB_DUE_RISK"])
        expect(jobAlerts({ ...job, order: null }, forecast({ state: "ON_TRACK", dueRisk: true }))).toEqual([])
    })
})

describe("kalıp bakımı uyarıları", () => {
    const mold = { id: "k-1", code: "K 1001", shotsAtLastMaintenance: 50_000 }
    const status = (totalShots: number, plannedAhead = 0) =>
        moldMaintenanceStatus({ totalShots, maintenanceIntervalShots: 100_000, shotsAtLastMaintenance: 50_000 }, plannedAhead)

    it("yaklaşıyor (%85 ya da planlı işlerle aşılacak) ve geldi; anahtar bakım döngüsünü taşır", () => {
        expect(moldAlerts(mold, status(140_000))).toEqual([{
            key: "mold:k-1:50000:soon",
            kind: "MOLD_MAINTENANCE_SOON",
            title: "Bakım yaklaşıyor · Kalıp K 1001",
            message: "Bakım yaklaşıyor · 90.000 / 100.000 baskı",
            href: "/uretim/kaliplar?q=K%201001",
        }])
        expect(moldAlerts(mold, status(120_000, 40_000))[0]).toMatchObject({ kind: "MOLD_MAINTENANCE_SOON", message: "Uygun · 70.000 / 100.000 baskı · planlı işlerle aşılacak" })
        expect(moldAlerts(mold, status(151_000))[0]).toMatchObject({ key: "mold:k-1:50000:due", kind: "MOLD_MAINTENANCE_DUE", title: "Bakım zamanı geldi · Kalıp K 1001" })
        expect(moldAlerts(mold, status(100_000))).toEqual([])
        expect(moldAlerts(mold, moldMaintenanceStatus({ totalShots: 1, maintenanceIntervalShots: null, shotsAtLastMaintenance: 0 }))).toEqual([])
    })
})

describe("teslim", () => {
    const late = jobAlerts(job, forecast())[0]
    const due = jobAlerts(job, forecast({ dueRisk: true }))[1]

    it("her kullanıcıya her anahtar bir kez; sonradan eklenen planlayıcı süren uyarıları alır", () => {
        const delivered = new Set([alertDeliveryKey("u-1", late.key)])
        expect(pendingAlertDeliveries([late, due, late], ["u-1", "u-2"], delivered).map(({ userId, alert }) => `${userId}:${alert.kind}`)).toEqual([
            "u-1:JOB_DUE_RISK",
            "u-2:JOB_LATE",
            "u-2:JOB_DUE_RISK",
        ])
        expect(pendingAlertDeliveries([late], [], delivered)).toEqual([])
    })

    it("canlı bildirim kullanıcı başına tek: bir uyarı kendisi, çoksa özet", () => {
        expect(realtimeAlertSummary([late])).toEqual({ title: late.title, message: late.message })
        const many = Array.from({ length: 5 }, (_, index) => ({ ...late, key: `k${index}`, title: `Uyarı ${index + 1}` }))
        expect(realtimeAlertSummary(many)).toEqual({ title: "5 yeni üretim uyarısı", message: "Uyarı 1 · Uyarı 2 · Uyarı 3 · +2 uyarı daha" })
    })
})
