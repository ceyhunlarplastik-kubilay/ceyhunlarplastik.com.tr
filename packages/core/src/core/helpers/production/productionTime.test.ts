import { describe, expect, it } from "vitest"

import {
    formatDurationMinutes,
    formatProductionDateTime,
    formatProductionShortDateTime,
    formatProductionTimeRange,
    formatWorkMinutes,
    productionDateKey,
    utcToWallTime,
    wallTimeToUtc,
} from "./productionTime"

describe("wallTimeToUtc / utcToWallTime — fabrika saati", () => {
    it("İstanbul duvar saatini UTC'ye çevirir ve geri döner", () => {
        const utc = wallTimeToUtc("2026-09-28T08:00")

        expect(utc?.toISOString()).toBe("2026-09-28T05:00:00.000Z")
        expect(utcToWallTime(utc!)).toBe("2026-09-28T08:00")
    })

    it("gece yarısı önceki UTC gününe düşer", () => {
        const utc = wallTimeToUtc("2026-01-01T00:00")

        expect(utc?.toISOString()).toBe("2025-12-31T21:00:00.000Z")
        expect(utcToWallTime("2025-12-31T21:00:00.000Z")).toBe("2026-01-01T00:00")
    })

    it("farkı sabit yazmaz: dilimin o tarihteki kuralını uygular", () => {
        // Türkiye 2016'ya kadar kışın UTC+2'ydi.
        expect(wallTimeToUtc("2015-01-15T08:00")?.toISOString()).toBe("2015-01-15T06:00:00.000Z")
        // Yaz saati olan dilimde geçiş gününün iki yanı.
        expect(wallTimeToUtc("2026-03-28T12:00", "Europe/Berlin")?.toISOString()).toBe("2026-03-28T11:00:00.000Z")
        expect(wallTimeToUtc("2026-03-29T12:00", "Europe/Berlin")?.toISOString()).toBe("2026-03-29T10:00:00.000Z")
    })

    it("geçersiz girdide null döner", () => {
        expect(wallTimeToUtc("2026-02-30T08:00")).toBeNull()
        expect(wallTimeToUtc("2026-09-28T24:00")).toBeNull()
        expect(wallTimeToUtc("2026-09-28 08:00")).toBeNull()
        expect(wallTimeToUtc("")).toBeNull()
    })
})

describe("productionDateKey", () => {
    it("fabrika takvimindeki günü verir (UTC'de hâlâ önceki gün olsa da)", () => {
        expect(productionDateKey(new Date("2026-09-24T22:30:00.000Z"))).toBe("2026-09-25")
    })
})

describe("biçimlendirme", () => {
    it("tarih-saat fabrika saatiyle yazılır", () => {
        expect(formatProductionDateTime("2026-09-28T05:00:00.000Z")).toBe("28.09.2026 08:00")
        expect(formatProductionShortDateTime("2026-09-28T05:00:00.000Z")).toBe("28.09 08:00")
    })

    it("aynı gündeki aralıkta bitişe yalnız saat yazılır", () => {
        expect(formatProductionTimeRange("2026-09-28T05:00:00.000Z", "2026-09-28T13:00:00.000Z"))
            .toBe("28.09.2026 08:00 – 16:00")
        expect(formatProductionTimeRange("2026-09-28T05:00:00.000Z", "2026-09-29T05:00:00.000Z"))
            .toBe("28.09.2026 08:00 – 29.09.2026 08:00")
    })

    it("süreyi okunur yazar", () => {
        expect(formatDurationMinutes(45)).toBe("45 dk")
        expect(formatDurationMinutes(480)).toBe("8 sa")
        expect(formatDurationMinutes(510)).toBe("8 sa 30 dk")
        expect(formatDurationMinutes(28 * 60 + 15)).toBe("1 gün 4 sa")
        expect(formatDurationMinutes(2 * 24 * 60)).toBe("2 gün")
        expect(formatDurationMinutes(0)).toBe("0 dk")
    })

    it("çalışma süresi günsüz: 34 sa 6 dk (1 gün 10 sa DEĞİL)", () => {
        // 20.000 adet · 4 göz · 20 sn · %2 fire · %85 verim · 45 dk bağlama = 2.046 dk.
        expect(formatWorkMinutes(2_046.18)).toBe("34 sa 6 dk")
        expect(formatDurationMinutes(2_046.18)).toBe("1 gün 10 sa")
        expect(formatWorkMinutes(45)).toBe("45 dk")
        expect(formatWorkMinutes(480)).toBe("8 sa")
        expect(formatWorkMinutes(0)).toBe("0 dk")
    })
})
