import { describe, expect, it } from "vitest"

import { boardMoveFormDefaults, boardMoveFormSchema, toRescheduleInput } from "./boardMoveForm"

describe("boardMoveForm", () => {
    it("fabrika saatiyle gelir, UTC'ye çevrilerek gider; sürüm iletilir", () => {
        const defaults = boardMoveFormDefaults({ machineId: "m1", setupStartAt: "2026-09-28T05:00:00.000Z" } as never)
        expect(defaults).toEqual({ machineId: "m1", startAt: "2026-09-28T08:00" })
        expect(toRescheduleInput({ machineId: "m2", startAt: "2026-09-29T16:30" }, { version: 4 })).toEqual({
            machineId: "m2",
            startAt: "2026-09-29T13:30:00.000Z",
            expectedVersion: 4,
        })
    })

    it("boş makine ve bozuk saat reddedilir", () => {
        expect(boardMoveFormSchema.safeParse({ machineId: "", startAt: "2026-09-29T16:30" }).success).toBe(false)
        expect(boardMoveFormSchema.safeParse({ machineId: "m1", startAt: "29.09.2026" }).success).toBe(false)
    })
})
