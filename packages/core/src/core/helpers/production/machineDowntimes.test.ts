import { describe, expect, it } from "vitest"

import {
    describeMachineDowntimeState,
    downtimeDurationMinutes,
    downtimesOverlap,
    downtimeTimeStatus,
    findMachineDowntimeIssues,
    MAX_DOWNTIME_DAYS,
} from "./machineDowntimes"

const at = (iso: string) => new Date(iso)

describe("findMachineDowntimeIssues", () => {
    it("geçerli aralığı kabul eder", () => {
        expect(findMachineDowntimeIssues({ startAt: "2026-09-28T05:00:00.000Z", endAt: "2026-09-28T13:00:00.000Z" })).toEqual([])
    })

    it("bitiş başlangıçtan sonra olmalı", () => {
        const codes = findMachineDowntimeIssues({ startAt: at("2026-09-28T05:00:00Z"), endAt: at("2026-09-28T05:00:00Z") })
            .map((issue) => issue.code)
        expect(codes).toEqual(["END_NOT_AFTER_START"])
    })

    it(`${MAX_DOWNTIME_DAYS} günden uzun duruşu ve geçersiz zamanı reddeder`, () => {
        expect(findMachineDowntimeIssues({ startAt: "2026-01-01T00:00:00Z", endAt: "2026-12-31T00:00:00Z" })[0].code)
            .toBe("TOO_LONG")
        expect(findMachineDowntimeIssues({ startAt: "yarın", endAt: "2026-12-31T00:00:00Z" })[0].code)
            .toBe("INVALID_START")
    })
})

describe("downtimesOverlap — yarı açık aralık", () => {
    const morning = { startAt: "2026-09-28T05:00:00Z", endAt: "2026-09-28T09:00:00Z" }

    it("uç uca değen duruşlar çakışmaz", () => {
        expect(downtimesOverlap(morning, { startAt: "2026-09-28T09:00:00Z", endAt: "2026-09-28T13:00:00Z" })).toBe(false)
    })

    it("kesişen ve kapsayan aralıklar çakışır", () => {
        expect(downtimesOverlap(morning, { startAt: "2026-09-28T08:00:00Z", endAt: "2026-09-28T10:00:00Z" })).toBe(true)
        expect(downtimesOverlap(morning, { startAt: "2026-09-28T00:00:00Z", endAt: "2026-09-29T00:00:00Z" })).toBe(true)
    })

    it("süreyi dakika olarak verir", () => {
        expect(downtimeDurationMinutes(morning)).toBe(240)
    })
})

describe("downtimeTimeStatus", () => {
    const interval = { startAt: "2026-09-28T05:00:00Z", endAt: "2026-09-28T13:00:00Z" }

    it("bitiş anında duruş bitmiş sayılır (yarı açık aralık)", () => {
        expect(downtimeTimeStatus(interval, at("2026-09-28T04:59:00Z"))).toBe("upcoming")
        expect(downtimeTimeStatus(interval, at("2026-09-28T05:00:00Z"))).toBe("active")
        expect(downtimeTimeStatus(interval, at("2026-09-28T13:00:00Z"))).toBe("past")
    })
})

describe("describeMachineDowntimeState", () => {
    const now = at("2026-09-25T10:00:00Z")
    const downtimes = [
        { id: "later", startAt: "2026-10-20T05:00:00Z", endAt: "2026-10-20T13:00:00Z" },
        { id: "soon", startAt: "2026-09-28T05:00:00Z", endAt: "2026-09-28T13:00:00Z" },
        { id: "past", startAt: "2026-09-20T05:00:00Z", endAt: "2026-09-20T13:00:00Z" },
    ]

    it("sürmekte olan duruşu öne alır", () => {
        const state = describeMachineDowntimeState(
            [...downtimes, { id: "now", startAt: "2026-09-25T09:00:00Z", endAt: "2026-09-25T12:00:00Z" }],
            now,
        )
        expect(state).toMatchObject({ status: "active", downtime: { id: "now" } })
    })

    it("7 gün içindeki en yakın duruşu gösterir, daha uzaktakini göstermez", () => {
        expect(describeMachineDowntimeState(downtimes, now)).toMatchObject({ status: "upcoming", downtime: { id: "soon" } })
        expect(describeMachineDowntimeState([downtimes[0], downtimes[2]], now)).toBeNull()
    })
})
