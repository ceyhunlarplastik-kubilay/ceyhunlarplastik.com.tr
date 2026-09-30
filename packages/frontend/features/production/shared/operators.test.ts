import { describe, expect, it } from "vitest"

import { formatOperatorName, formatOperatorShortName, sortOperators } from "./operators"

describe("operatör adları", () => {
    const op = (id: string, firstName: string, lastName: string, isActive = true) => ({ id, firstName, lastName, employeeNo: null, isActive })

    it("ad ve kısa ad", () => {
        expect(formatOperatorName(op("1", "Ahmet", "Yılmaz"))).toBe("Ahmet Yılmaz")
        expect(formatOperatorShortName(op("1", "Ahmet", "ışık"))).toBe("Ahmet I.")
    })

    it("aktifler önce, Türkçe soyad sırası", () => {
        const sorted = sortOperators([op("1", "Can", "Zeybek"), op("2", "Ali", "Çelik"), op("3", "Veli", "Acar", false), op("4", "Ayşe", "Cengiz")])
        expect(sorted.map((entry) => entry.id)).toEqual(["4", "2", "1", "3"])
    })
})
