import { describe, expect, it } from "vitest"

import type { RosterMachine } from "@/features/production/roster/api/types"
import { groupRosterByArea, operatorLoad, unassignedOperators } from "./rosterView"

const machine = (id: string, areaId: string, operatorIds: string[][]): RosterMachine => ({
    id, code: id, name: id, status: "ACTIVE", area: { id: areaId, code: areaId, name: areaId }, shiftPatternName: "3×8", exception: null,
    shifts: operatorIds.map((ids, index) => ({ code: ["A", "B", "C"][index], name: "", startAt: "", endAt: "", operatorIds: ids })),
    orphans: [],
})
const op = (id: string, isActive = true) => ({ id, firstName: id, lastName: id, employeeNo: null, isActive })

describe("rosterView", () => {
    const machines = [machine("m1", "a", [["ahmet"], ["ayse"]]), machine("m2", "a", [["ahmet"]]), machine("m3", "b", [[]])]

    it("alan grupları ve süzgeç", () => {
        expect(groupRosterByArea(machines).map((group) => [group.area.id, group.machines.length])).toEqual([["a", 2], ["b", 1]])
        expect(groupRosterByArea(machines, "b").map((group) => group.area.id)).toEqual(["b"])
    })

    it("boştaki aktif operatörler ve görev sayısı", () => {
        const day = { machines, operators: [op("ahmet"), op("ayse"), op("veli"), op("pasif", false)] }
        expect(unassignedOperators(day).map((operator) => operator.id)).toEqual(["veli"])
        expect(operatorLoad(day).get("ahmet")).toBe(2)
    })
})
