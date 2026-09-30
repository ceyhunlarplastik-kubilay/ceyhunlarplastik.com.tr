import { describe, expect, it } from "vitest"

import { copyRosterDefaults, copyRosterFormSchema } from "./copyRosterForm"

describe("copyRosterForm", () => {
    it("varsayılan ertesi gün + 5 gün; kaynak günü içeren aralık reddedilir", () => {
        expect(copyRosterDefaults("2026-09-28")).toEqual({ toStart: "2026-09-29", toEnd: "2026-10-03" })
        const schema = copyRosterFormSchema("2026-09-28")
        expect(schema.safeParse(copyRosterDefaults("2026-09-28")).success).toBe(true)
        expect(schema.safeParse({ toStart: "2026-09-27", toEnd: "2026-09-29" }).success).toBe(false)
    })
})
