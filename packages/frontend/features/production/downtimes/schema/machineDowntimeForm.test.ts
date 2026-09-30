import { describe, expect, it } from "vitest"

import type { MachineDowntime } from "@/features/production/downtimes/api/types"
import {
    describeDowntimeAuthor,
    recentDowntimesWindow,
    sortDowntimesForList,
} from "@/features/production/downtimes/lib/downtimeList"
import {
    buildMachineDowntimePayload,
    createMachineDowntimeFormDefaults,
    machineDowntimeFormSchema,
} from "./machineDowntimeForm"

const MACHINE_ID = "44444444-4444-4444-8444-444444444444"

describe("machineDowntimeForm — fabrika saati", () => {
    it("formdaki İstanbul saatini UTC ISO olarak gönderir", () => {
        expect(buildMachineDowntimePayload({
            machineId: MACHINE_ID,
            kind: "PLANNED_MAINTENANCE",
            startAt: "2026-09-28T08:00",
            endAt: "2026-09-28T16:00",
            reason: "",
        })).toEqual({
            machineId: MACHINE_ID,
            kind: "PLANNED_MAINTENANCE",
            startAt: "2026-09-28T05:00:00.000Z",
            endAt: "2026-09-28T13:00:00.000Z",
            reason: null,
        })
    })

    it("kayıttaki UTC zamanı formda fabrika saatiyle gösterir", () => {
        const values = createMachineDowntimeFormDefaults({
            machineId: MACHINE_ID,
            kind: "BREAKDOWN",
            startAt: "2026-09-28T21:30:00.000Z",
            endAt: "2026-09-29T02:00:00.000Z",
            reason: "Hidrolik kaçak",
        } as MachineDowntime, { today: "2026-09-25" })

        expect(values).toMatchObject({ startAt: "2026-09-29T00:30", endAt: "2026-09-29T05:00", reason: "Hidrolik kaçak" })
    })

    it("yeni kayıt yarın 08:00–16:00 planlı bakımdır", () => {
        expect(createMachineDowntimeFormDefaults(null, { today: "2026-12-31", machineId: MACHINE_ID })).toEqual({
            machineId: MACHINE_ID,
            kind: "PLANNED_MAINTENANCE",
            startAt: "2027-01-01T08:00",
            endAt: "2027-01-01T16:00",
            reason: "",
        })
    })

    it("bitiş başlangıçtan önce ya da eşitse bitiş alanında hata verir", () => {
        const result = machineDowntimeFormSchema.safeParse({
            machineId: MACHINE_ID,
            kind: "OTHER",
            startAt: "2026-09-28T16:00",
            endAt: "2026-09-28T16:00",
            reason: "",
        })

        expect(result.success).toBe(false)
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(["endAt"])
    })
})

describe("downtimeList", () => {
    it("pencere başı fabrika takviminde 30 gün önceki günün 00:00'ıdır", () => {
        expect(recentDowntimesWindow(new Date("2026-09-25T10:00:00.000Z"))).toEqual({ from: "2026-08-25T21:00:00.000Z" })
    })

    it("sürenleri ve yaklaşanları başa, geçmişleri en yeni üstte sona dizer", () => {
        const now = new Date("2026-09-25T10:00:00.000Z")
        const list = [
            { id: "past-old", startAt: "2026-09-01T05:00:00Z", endAt: "2026-09-01T09:00:00Z" },
            { id: "later", startAt: "2026-10-10T05:00:00Z", endAt: "2026-10-10T09:00:00Z" },
            { id: "past-new", startAt: "2026-09-20T05:00:00Z", endAt: "2026-09-20T09:00:00Z" },
            { id: "now", startAt: "2026-09-25T08:00:00Z", endAt: "2026-09-25T12:00:00Z" },
        ]

        expect(sortDowntimesForList(list, now).map((entry) => entry.id)).toEqual(["now", "later", "past-new", "past-old"])
    })

    it("gireni adıyla yazar; ad yoksa null", () => {
        expect(describeDowntimeAuthor({ firstName: "Ayşe", lastName: "Kaya" })).toBe("Ayşe Kaya")
        expect(describeDowntimeAuthor({ firstName: null, lastName: null })).toBeNull()
        expect(describeDowntimeAuthor(null)).toBeNull()
    })
})
