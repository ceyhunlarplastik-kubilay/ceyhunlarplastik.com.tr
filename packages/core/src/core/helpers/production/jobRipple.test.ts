import { describe, expect, it } from "vitest"

import { rippleEarliestStart, selectRippleFollowers } from "./jobRipple"

const at = (iso: string) => new Date(iso)

describe("selectRippleFollowers", () => {
    const jobs = [
        { id: "j3", machineId: "m1", status: "PLANNED", setupStartAt: at("2026-10-06T08:00:00Z") },
        { id: "j1", machineId: "m1", status: "PLANNED", setupStartAt: at("2026-10-05T05:00:00Z") },
        { id: "j2", machineId: "m1", status: "PLANNED", setupStartAt: at("2026-10-05T12:00:00Z") },
        { id: "run", machineId: "m1", status: "RUNNING", setupStartAt: at("2026-10-05T20:00:00Z") },
        { id: "other", machineId: "m2", status: "PLANNED", setupStartAt: at("2026-10-05T12:00:00Z") },
    ]

    it("aynı makinede, bırakılan andan sonra başlayan planlı işler; taşınan iş hariç; sıralı", () => {
        expect(selectRippleFollowers(jobs, { machineId: "m1", from: at("2026-10-05T06:00:00Z") }).map((job) => job.id))
            .toEqual(["j2", "j3"])
        expect(selectRippleFollowers(jobs, { machineId: "m1", from: at("2026-10-05T05:00:00Z"), excludeJobId: "j2" }).map((job) => job.id))
            .toEqual(["j1", "j3"])
    })
})

describe("rippleEarliestStart", () => {
    it("boşluk korunur; öndeki iş taşıyorsa arkasına", () => {
        expect(rippleEarliestStart(at("2026-10-06T08:00:00Z"), at("2026-10-05T20:00:00Z")).toISOString()).toBe("2026-10-06T08:00:00.000Z")
        expect(rippleEarliestStart(at("2026-10-05T12:00:00Z"), at("2026-10-05T20:00:00Z")).toISOString()).toBe("2026-10-05T20:00:00.000Z")
    })
})
