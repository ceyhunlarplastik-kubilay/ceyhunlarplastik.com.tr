import { describe, expect, it } from "vitest"

import { lotNoteFormDefaults, lotNoteFormSchema, NO_OPERATOR, toLotNoteInput } from "./lotNoteForm"

describe("lotNoteForm", () => {
    it("metin kırpılır; operatör seçilmezse null", () => {
        const values = lotNoteFormSchema.parse({ category: "QUALITY", operatorId: NO_OPERATOR, body: "  Renk açık.  " })
        expect(toLotNoteInput(values)).toEqual({ category: "QUALITY", body: "Renk açık.", operatorId: null })
        expect(toLotNoteInput({ ...values, operatorId: "op-1" }).operatorId).toBe("op-1")
    })

    it("boş not ve bilinmeyen kategori reddedilir", () => {
        expect(lotNoteFormSchema.safeParse(lotNoteFormDefaults).success).toBe(false)
        expect(lotNoteFormSchema.safeParse({ ...lotNoteFormDefaults, body: "x", category: "OTHER" }).success).toBe(false)
    })
})
