import { describe, expect, it, vi } from "vitest"

import { runProductionAlertSweep } from "./sweep"

// 2099-01-05 Pazartesi 12:00Z; 7/24 düzen — tahmin saatten bağımsız.
const NOW = new Date("2099-01-05T12:00:00.000Z")
const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7]

const lateJob = {
    id: "j-1",
    status: "RUNNING",
    lotBaseNumber: 1000,
    machineId: "m-1",
    machineCode: "M-01",
    moldId: "k-1",
    setupStartAt: new Date("2099-01-05T08:00:00.000Z"),
    productionStartAt: new Date("2099-01-05T08:30:00.000Z"),
    plannedEndAt: new Date("2099-01-05T10:30:00.000Z"),
    plannedShots: 360,
    cycleTimeSec: 20,
    efficiencyPercent: 100,
    setupMinutes: 30,
    // Üretim 11:00'de başladı (plan 08:30) → 120 dk → tahmini bitiş 13:00; planlı bitiş geçti.
    lots: [{ status: "RUNNING", actualStartAt: new Date("2099-01-05T11:00:00.000Z"), actualEndAt: null, actualShots: null, reported: false }],
    // Termin dün (04.01) — tahmini bitiş onu aşıyor.
    dueDates: ["2099-01-04"],
    orders: [{ orderNumber: "UE-1001", variantCode: "10.1.3.V1", dueDate: "2099-01-04" }],
}

const mold = (override: Record<string, unknown> = {}) => ({
    id: "k-1", code: "K-1001", status: "ACTIVE", totalShots: 95_000, maintenanceIntervalShots: 100_000, shotsAtLastMaintenance: 0, ...override,
})

function buildDeps(options: { recipients?: string[]; delivered?: string[]; molds?: unknown[]; publishError?: boolean; withPublisher?: boolean } = {}) {
    const { recipients = ["u-1", "u-2"], delivered = [], molds = [mold()], publishError = false, withPublisher = true } = options
    const publishToUser = vi.fn(async () => {
        if (publishError) throw new Error("iot kapalı")
    })
    return {
        userRepository: { listActiveUsersByGroups: vi.fn().mockResolvedValue(recipients.map((id) => ({ id }))) },
        userNotificationRepository: {
            createNotifications: vi.fn().mockImplementation(async (rows: unknown[]) => rows.length),
            listDeliveredProductionAlertKeys: vi.fn().mockResolvedValue(new Set(delivered)),
        },
        productionJobRepository: {
            listJobsForAlerts: vi.fn().mockResolvedValue([lateJob]),
            sumUpcomingPlannedShotsByMold: vi.fn().mockResolvedValue(new Map([["k-1", 1_000]])),
        },
        productionMoldRepository: { listMolds: vi.fn().mockResolvedValue(molds) },
        productionMachineRepository: { listMachines: vi.fn().mockResolvedValue([{ id: "m-1", areaId: "a-1", shiftPatternId: "p-1" }]) },
        productionAreaRepository: { listAreas: vi.fn().mockResolvedValue([{ id: "a-1", shiftPatternId: null }]) },
        productionShiftPatternRepository: {
            listShiftPatterns: vi.fn().mockResolvedValue([{
                id: "p-1", name: "7/24", isDefault: true, timezone: "Europe/Istanbul",
                shifts: [{ code: "A", name: "Tam gün", startMinute: 0, durationMinutes: 1440, daysOfWeek: ALL_DAYS, sortOrder: 0 }],
            }]),
        },
        productionCalendarExceptionRepository: { listExceptions: vi.fn().mockResolvedValue([]) },
        productionMachineDowntimeRepository: { listDowntimes: vi.fn().mockResolvedValue([]) },
        publishToUser: withPublisher ? publishToUser : null,
        logWarning: vi.fn(),
    }
}

describe("runProductionAlertSweep", () => {
    it("alıcı yoksa hiçbir şey okunmaz, yazılmaz", async () => {
        const deps = buildDeps({ recipients: [] })
        expect(await runProductionAlertSweep(deps as never, NOW)).toEqual({ recipients: 0, alerts: 0, delivered: 0 })
        expect(deps.productionJobRepository.listJobsForAlerts).not.toHaveBeenCalled()
        expect(deps.userNotificationRepository.createNotifications).not.toHaveBeenCalled()
    })

    it("geciken iş + termin riski + bakımı yaklaşan kalıp: her alıcıya birer bildirim, canlı yayın kullanıcı başına tek özet", async () => {
        const deps = buildDeps()
        const result = await runProductionAlertSweep(deps as never, NOW)

        expect(result).toEqual({ recipients: 2, alerts: 3, delivered: 6 })
        expect(deps.userRepository.listActiveUsersByGroups).toHaveBeenCalledWith(["production_planner"])
        // Takvim bugünü kapsayan aralıkla okunur (tahtayla aynı kural).
        expect(deps.productionCalendarExceptionRepository.listExceptions).toHaveBeenCalledWith({ from: "2098-12-05", to: "2099-02-21" })

        const [rows] = deps.userNotificationRepository.createNotifications.mock.calls[0] as [Array<{ userId: string; type: string; title: string; data: Record<string, string> }>]
        expect(rows.filter((row) => row.userId === "u-1").map((row) => [row.type, row.title, row.data.kind])).toEqual([
            ["PRODUCTION_ALERT", "Süresi geçti · İş 1000", "JOB_LATE"],
            ["PRODUCTION_ALERT", "Termin riski · İş 1000", "JOB_DUE_RISK"],
            ["PRODUCTION_ALERT", "Bakım yaklaşıyor · Kalıp K-1001", "MOLD_MAINTENANCE_SOON"],
        ])
        expect(rows[0].data).toEqual({
            kind: "JOB_LATE",
            alertKey: "job:j-1:late:2099-01-05T10:30:00.000Z",
            href: "/uretim/tahta?bas=2099-01-05&is=1000",
        })

        expect(deps.publishToUser).toHaveBeenCalledTimes(2)
        expect(deps.publishToUser).toHaveBeenCalledWith("u-1", expect.objectContaining({
            eventType: "production.alert",
            notificationType: "PRODUCTION_ALERT",
            title: "3 yeni üretim uyarısı",
            occurredAt: NOW.toISOString(),
        }))
    })

    it("daha önce gitmiş anahtar tekrar gitmez; yalnız eksik olanlar yazılır ve yayınlanır", async () => {
        const deps = buildDeps({
            delivered: [
                "u-1|job:j-1:late:2099-01-05T10:30:00.000Z",
                "u-1|job:j-1:due:2099-01-04",
                "u-1|mold:k-1:0:soon",
                "u-2|mold:k-1:0:soon",
            ],
        })
        expect(await runProductionAlertSweep(deps as never, NOW)).toEqual({ recipients: 2, alerts: 3, delivered: 2 })
        const [rows] = deps.userNotificationRepository.createNotifications.mock.calls[0] as [Array<{ userId: string }>]
        expect(rows.map((row) => row.userId)).toEqual(["u-2", "u-2"])
        expect(deps.publishToUser).toHaveBeenCalledTimes(1)

        const nothingNew = buildDeps({ delivered: ["u-1", "u-2"].flatMap((user) => ["job:j-1:late:2099-01-05T10:30:00.000Z", "job:j-1:due:2099-01-04", "mold:k-1:0:soon"].map((key) => `${user}|${key}`)) })
        expect((await runProductionAlertSweep(nothingNew as never, NOW)).delivered).toBe(0)
        expect(nothingNew.userNotificationRepository.createNotifications).not.toHaveBeenCalled()
    })

    it("kullanımdaki olmayan kalıp bakım uyarısı üretmez; canlı yayın hatası bildirimi bozmaz", async () => {
        const deps = buildDeps({ molds: [mold({ status: "IN_MAINTENANCE" })], publishError: true })
        const result = await runProductionAlertSweep(deps as never, NOW)
        expect(result).toEqual({ recipients: 2, alerts: 2, delivered: 4 })
        expect(deps.logWarning).toHaveBeenCalledTimes(2)

        const noPublisher = buildDeps({ withPublisher: false })
        expect((await runProductionAlertSweep(noPublisher as never, NOW)).delivered).toBe(6)
    })
})
