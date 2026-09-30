import { describe, expect, it } from "vitest"

import {
    buildLotOperatorSnapshot,
    canDeleteLotNote,
    findLotNoteIssue,
    formatLotNumber,
    MAX_LOT_NOTE_LENGTH,
    parseLotNumber,
    resolveLotOperators,
} from "./productionLots"

describe("lot numarası", () => {
    it("kök-sıra biçimi; bozuk ya da sıfır sıra reddedilir", () => {
        expect(parseLotNumber("1000-2")).toEqual({ lotBaseNumber: 1000, sequence: 2 })
        expect(parseLotNumber(" 1000-12 ")).toEqual({ lotBaseNumber: 1000, sequence: 12 })
        expect(parseLotNumber(formatLotNumber(1005, 3))).toEqual({ lotBaseNumber: 1005, sequence: 3 })
        for (const value of ["1000", "1000-", "-2", "1000-0", "UE-1001", "1000-2-1", "1000-12345"]) {
            expect(parseLotNumber(value)).toBeNull()
        }
    })
})

describe("lot notları", () => {
    it("boş ve uzun not reddedilir", () => {
        expect(findLotNoteIssue("  Renk tonu açık, kalıp sıcaklığı düşürüldü.  ")).toBeNull()
        expect(findLotNoteIssue("   ")).toBe("Not boş olamaz.")
        expect(findLotNoteIssue("x".repeat(MAX_LOT_NOTE_LENGTH + 1))).toContain("en fazla")
    })

    it("notu yazan ya da admin / owner siler", () => {
        const note = { authorUserId: "u1" }
        expect(canDeleteLotNote(note, { id: "u1", isAdmin: false, isOwner: false })).toBe(true)
        expect(canDeleteLotNote(note, { id: "u2", isAdmin: false, isOwner: false })).toBe(false)
        expect(canDeleteLotNote(note, { id: "u2", isAdmin: true, isOwner: false })).toBe(true)
        expect(canDeleteLotNote({ authorUserId: null }, { id: null, isAdmin: false, isOwner: false })).toBe(false)
    })
})

describe("lotun ekibi", () => {
    it("lota özel > vardiya ekibi > kimse", () => {
        expect(resolveLotOperators(["a"], ["b"])).toEqual({ source: "lot", operators: ["a"] })
        expect(resolveLotOperators([], ["b"])).toEqual({ source: "roster", operators: ["b"] })
        expect(resolveLotOperators([], [])).toEqual({ source: "none", operators: [] })
    })

    it("tamamlanırken yalnız lota özel ekibi olmayan lotlar vardiya ekibinden dondurulur", () => {
        const rows = buildLotOperatorSnapshot({
            lots: [
                { id: "l1", shiftDate: "2026-09-28", shiftCode: "A", lotOperatorCount: 0 },
                { id: "l2", shiftDate: "2026-09-28", shiftCode: "B", lotOperatorCount: 2 },
                { id: "l3", shiftDate: "2026-09-29", shiftCode: "A", lotOperatorCount: 0 },
            ],
            assignments: [
                { shiftDate: "2026-09-28", shiftCode: "A", operatorId: "ahmet" },
                { shiftDate: "2026-09-28", shiftCode: "A", operatorId: "mehmet" },
                { shiftDate: "2026-09-28", shiftCode: "B", operatorId: "ayse" },
            ],
        })
        expect(rows).toEqual([{ lotId: "l1", operatorId: "ahmet" }, { lotId: "l1", operatorId: "mehmet" }])
    })
})
