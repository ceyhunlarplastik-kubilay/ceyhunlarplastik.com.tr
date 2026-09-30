import { describe, expect, it } from "vitest"

import { groupCalendarExceptionDays } from "@core/helpers/production/productionCalendar"
import type { CalendarException } from "@/features/production/calendar/api/types"
import {
    buildCalendarExceptionEntryPayload,
    calendarExceptionFormSchema,
    createCalendarExceptionFormDefaults,
    describeCalendarEntryPreview,
    parseScopeValue,
} from "./calendarExceptionForm"

const AREA_ID = "33333333-3333-4333-8333-333333333333"

const day = (id: string, date: string): CalendarException => ({
    id,
    date,
    kind: "HOLIDAY",
    note: "Kurban Bayramı",
    areaId: AREA_ID,
    area: { id: AREA_ID, code: "P1", name: "Parkur 1" },
    machineId: null,
    machine: null,
    createdAt: "2026-09-25T08:00:00.000Z",
    updatedAt: "2026-09-25T08:00:00.000Z",
})

describe("parseScopeValue", () => {
    it("tek seçimi alan / makine / fabrikaya çevirir", () => {
        expect(parseScopeValue("factory")).toEqual({ areaId: null, machineId: null })
        expect(parseScopeValue(`area:${AREA_ID}`)).toEqual({ areaId: AREA_ID, machineId: null })
        expect(parseScopeValue("machine:m-1")).toEqual({ areaId: null, machineId: "m-1" })
    })
})

describe("calendarExceptionFormSchema", () => {
    it("ters aralığı bitiş alanında gösterir", () => {
        const result = calendarExceptionFormSchema.safeParse({
            kind: "HOLIDAY",
            startDate: "2026-05-30",
            endDate: "2026-05-26",
            scope: "factory",
            note: "",
        })

        expect(result.success).toBe(false)
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(["endDate"])
    })

    it("bitişi boş tek günlük kaydı kabul eder", () => {
        expect(calendarExceptionFormSchema.safeParse({
            kind: "EXTRA_WORKDAY",
            startDate: "2026-06-07",
            endDate: "",
            scope: `area:${AREA_ID}`,
            note: "",
        }).success).toBe(true)
    })
})

describe("düzenleme ve gönderim", () => {
    it("birleşik satırdan formu doldurur ve günlerini replaceIds olarak gönderir", () => {
        const [group] = groupCalendarExceptionDays([day("d2", "2026-05-27"), day("d1", "2026-05-26")])
        const values = createCalendarExceptionFormDefaults(group, "2026-09-25")

        expect(values).toEqual({
            kind: "HOLIDAY",
            startDate: "2026-05-26",
            endDate: "2026-05-27",
            scope: `area:${AREA_ID}`,
            note: "Kurban Bayramı",
        })
        expect(buildCalendarExceptionEntryPayload(values, group.ids)).toEqual({
            areaId: AREA_ID,
            machineId: null,
            startDate: "2026-05-26",
            endDate: "2026-05-27",
            kind: "HOLIDAY",
            note: "Kurban Bayramı",
            replaceIds: ["d1", "d2"],
        })
    })

    it("yeni kayıtta bugünden başlar, bitiş boş ve fabrika kapsamındadır", () => {
        const values = createCalendarExceptionFormDefaults(null, "2026-09-25")

        expect(values).toMatchObject({ startDate: "2026-09-25", endDate: "", scope: "factory" })
        expect(buildCalendarExceptionEntryPayload(values)).not.toHaveProperty("replaceIds")
    })
})

describe("describeCalendarEntryPreview", () => {
    it("gün sayısını ve haftanın günlerini yazar; geçersizde null", () => {
        expect(describeCalendarEntryPreview("2026-05-26", "2026-05-28")).toBe("3 gün · 26.05.2026 Sal – 28.05.2026 Per")
        expect(describeCalendarEntryPreview("2026-10-29", "")).toBe("1 gün · 29.10.2026 Per")
        expect(describeCalendarEntryPreview("2026-05-28", "2026-05-26")).toBeNull()
    })
})
