import { describe, expect, it } from "vitest"

import type { BoardJob } from "@/features/production/board/api/types"
import {
    actualLotSpans,
    boardAlerts,
    canPushFollowers,
    describeForecast,
    describeMaintenance,
    plannedFollowersOnBoard,
    progressLabel,
    projectedDelaySpan,
} from "./boardForecast"

const lot = (sequence: number, override: Partial<BoardJob["lots"][number]> = {}): BoardJob["lots"][number] => ({
    lotNumber: `1000-${sequence}`, sequence, shiftDate: "2026-09-28", shiftCode: sequence === 1 ? "A" : "B",
    plannedStartAt: "2026-09-28T05:00:00.000Z", plannedEndAt: "2026-09-28T13:00:00.000Z", plannedShots: 500,
    status: "PLANNED", actualStartAt: null, actualEndAt: null, actualShots: null, reported: false,
    ...override,
})

const noMaintenance: BoardJob["moldMaintenance"] = { level: "NONE", projectedLevel: "NONE", shotsSinceMaintenance: 0, intervalShots: null, remainingShots: null, ratio: null }

function boardJob(override: Partial<BoardJob> = {}): BoardJob {
    return {
        id: "j1", lotBaseNumber: 1000, status: "RUNNING", version: 1, machineId: "m1",
        mold: { id: "k1", code: "K-1", name: "Kalıp", totalShots: 0, maintenanceIntervalShots: null, shotsAtLastMaintenance: 0 },
        setupStartAt: "2026-09-28T04:30:00.000Z", productionStartAt: "2026-09-28T05:00:00.000Z", plannedEndAt: "2026-09-28T17:00:00.000Z",
        plannedShots: 1000, cycleTimeSec: 20, efficiencyPercent: 85, setupMinutes: 30,
        forecast: { state: "BEHIND", progress: 0.45, reportedShots: 450, remainingShots: 550, projectedEndAt: "2026-09-28T18:30:00.000Z", delayMinutes: 90, dueRisk: false },
        moldMaintenance: noMaintenance,
        colorHex: null, colorName: null, outputs: [],
        lots: [
            lot(1, { status: "COMPLETED", actualStartAt: "2026-09-28T05:10:00.000Z", actualEndAt: "2026-09-28T13:00:00.000Z", actualShots: 450, reported: true }),
            lot(2, { status: "RUNNING", actualStartAt: "2026-09-28T13:20:00.000Z" }),
            lot(3),
        ],
        machineFit: [],
        ...override,
    }
}

describe("gerçekleşen ve tahmin çizimi", () => {
    it("raporlu lot başlangıç → bitiş, üretimdeki lot başlangıç → şimdi; başlamamış lot çizilmez", () => {
        const spans = actualLotSpans(boardJob(), new Date("2026-09-28T15:00:00.000Z"))
        expect(spans.map((span) => [new Date(span.startMs).toISOString(), new Date(span.endMs).toISOString()])).toEqual([
            ["2026-09-28T05:10:00.000Z", "2026-09-28T13:00:00.000Z"],
            ["2026-09-28T13:20:00.000Z", "2026-09-28T15:00:00.000Z"],
        ])
    })

    it("gecikme uzantısı planlı bitişten tahmini bitişe; iş bitmişse ya da planında gidiyorsa yok", () => {
        const span = projectedDelaySpan(boardJob())
        expect(span && [new Date(span.startMs).toISOString(), new Date(span.endMs).toISOString()]).toEqual(["2026-09-28T17:00:00.000Z", "2026-09-28T18:30:00.000Z"])
        expect(projectedDelaySpan(boardJob({ forecast: { ...boardJob().forecast, state: "PRODUCED" } }))).toBeNull()
        expect(projectedDelaySpan(boardJob({ forecast: { ...boardJob().forecast, state: "ON_TRACK", projectedEndAt: "2026-09-28T16:50:00.000Z", delayMinutes: 0 } }))).toBeNull()
        // Eşik altı (plana uygun) birkaç dakikalık sapma çizilmez.
        expect(projectedDelaySpan(boardJob({ forecast: { ...boardJob().forecast, state: "ON_TRACK", projectedEndAt: "2026-09-28T17:10:00.000Z", delayMinutes: 10 } }))).toBeNull()
        expect(projectedDelaySpan(boardJob({ forecast: { ...boardJob().forecast, projectedEndAt: null, delayMinutes: null } }))).toBeNull()
    })

    it("ilerleme etiketi yalnız başlamış işte; metinler", () => {
        expect(progressLabel(boardJob())).toBe("%45")
        expect(progressLabel(boardJob({ status: "RELEASED", forecast: { ...boardJob().forecast, reportedShots: 0, progress: 0 } }))).toBeNull()
        expect(describeForecast(boardJob().forecast)).toBe("Geride · tahmini bitiş 28.09 21:30 (+1 sa 30 dk)")
        expect(describeForecast({ ...boardJob().forecast, projectedEndAt: null, delayMinutes: null, dueRisk: true })).toBe("Geride · tahmini bitiş hesaplanamadı · termin riski")
        expect(describeForecast({ ...boardJob().forecast, state: "PRODUCED" })).toBe("Üretim bitti, kapatılmadı")
    })
})

describe("uyarı şeridi", () => {
    it("geciken işler gecikmeye göre, hesaplanamayan en üstte; plana uygun iş yok", () => {
        const onTrack = boardJob({ id: "j2", lotBaseNumber: 1001, forecast: { ...boardJob().forecast, state: "ON_TRACK", delayMinutes: 10 } })
        const slightly = boardJob({ id: "j3", lotBaseNumber: 1002, forecast: { ...boardJob().forecast, delayMinutes: 40 } })
        const unknown = boardJob({ id: "j4", lotBaseNumber: 1003, forecast: { ...boardJob().forecast, projectedEndAt: null, delayMinutes: null } })
        const dueRisk = boardJob({ id: "j5", lotBaseNumber: 1004, forecast: { ...boardJob().forecast, state: "ON_TRACK", delayMinutes: 0, dueRisk: true } })
        expect(boardAlerts([slightly, onTrack, boardJob(), unknown, dueRisk]).lateJobs.map((job) => job.lotBaseNumber)).toEqual([1003, 1000, 1002, 1004])
    })

    it("bakımı gelen kalıp bir kez listelenir; planlı baskılarla aşılacak olan da uyarır", () => {
        const soon = { ...noMaintenance, level: "SOON" as const, projectedLevel: "DUE" as const, shotsSinceMaintenance: 90_000, intervalShots: 100_000, remainingShots: 10_000, ratio: 0.9 }
        const due = { ...soon, level: "DUE" as const, shotsSinceMaintenance: 101_000, remainingShots: -1_000, ratio: 1.01 }
        const projectedOnly = { ...soon, level: "OK" as const, shotsSinceMaintenance: 50_000, remainingShots: 50_000, ratio: 0.5 }
        const jobs = [
            boardJob({ moldMaintenance: soon }),
            boardJob({ id: "j2", moldMaintenance: soon }),
            boardJob({ id: "j3", mold: { ...boardJob().mold, id: "k2", code: "K-2" }, moldMaintenance: due }),
            boardJob({ id: "j4", mold: { ...boardJob().mold, id: "k3", code: "K-3" }, moldMaintenance: projectedOnly }),
            boardJob({ id: "j5", mold: { ...boardJob().mold, id: "k4", code: "K-4" }, moldMaintenance: { ...projectedOnly, projectedLevel: "SOON" } }),
        ]
        expect(boardAlerts(jobs).maintenanceMolds.map((entry) => entry.mold.code)).toEqual(["K-2", "K-1", "K-3"])
        expect(describeMaintenance(soon)).toBe("Bakım yaklaşıyor · 90.000 / 100.000 baskı · planlı işlerle aşılacak")
        expect(describeMaintenance(due)).toBe("Bakım zamanı geldi · 101.000 / 100.000 baskı")
        expect(describeMaintenance(noMaintenance)).toBe("Aralık tanımsız")
    })
})

describe("sonraki işleri kaydır", () => {
    it("yalnız sahaya verilmiş / üretimdeki geciken işte sunulur", () => {
        expect(canPushFollowers(boardJob())).toBe(true)
        expect(canPushFollowers(boardJob({ status: "PLANNED" }))).toBe(false)
        expect(canPushFollowers(boardJob({ forecast: { ...boardJob().forecast, state: "ON_TRACK", projectedEndAt: "2026-09-28T17:00:00.000Z", delayMinutes: 0 } }))).toBe(false)
        // Eşik altı gecikme çizilmez ama arkadaki işle çakışabilir — sunucuyla aynı koşul.
        expect(canPushFollowers(boardJob({ forecast: { ...boardJob().forecast, state: "ON_TRACK", projectedEndAt: "2026-09-28T17:10:00.000Z", delayMinutes: 10 } }))).toBe(true)
        expect(canPushFollowers(boardJob({ forecast: { ...boardJob().forecast, state: "PRODUCED" } }))).toBe(false)
    })

    it("onay listesi: aynı makinede bu işten sonra başlayan planlı işler, zamana göre", () => {
        const running = boardJob()
        const later = boardJob({ id: "a", lotBaseNumber: 1002, status: "PLANNED", setupStartAt: "2026-09-29T05:00:00.000Z" })
        const next = boardJob({ id: "b", lotBaseNumber: 1001, status: "PLANNED", setupStartAt: "2026-09-28T17:00:00.000Z" })
        const otherMachine = boardJob({ id: "c", status: "PLANNED", machineId: "m2", setupStartAt: "2026-09-28T18:00:00.000Z" })
        const released = boardJob({ id: "d", status: "RELEASED", setupStartAt: "2026-09-28T19:00:00.000Z" })
        expect(plannedFollowersOnBoard(running, [later, running, next, otherMachine, released]).map((job) => job.lotBaseNumber)).toEqual([1001, 1002])
    })
})
