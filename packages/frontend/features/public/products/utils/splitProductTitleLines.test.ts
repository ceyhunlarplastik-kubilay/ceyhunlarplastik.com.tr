import { describe, expect, it } from "vitest"
import { splitProductTitleLines } from "@/features/public/products/utils/splitProductTitleLines"

describe("splitProductTitleLines", () => {
    it("ilk 2 kelimeyi üst satıra, kalanını alt satıra ayırır", () => {
        expect(splitProductTitleLines("Endüstriyel Plastik Dişli Kutusu")).toEqual({
            firstLine: "Endüstriyel Plastik",
            secondLine: "Dişli Kutusu",
        })
    })

    it("2 veya daha az kelimede ikinci satırı boş bırakır", () => {
        expect(splitProductTitleLines("Dişli Kutusu")).toEqual({
            firstLine: "Dişli Kutusu",
            secondLine: "",
        })
        expect(splitProductTitleLines("Dişli")).toEqual({
            firstLine: "Dişli",
            secondLine: "",
        })
    })

    it("fazladan boşlukları normalize eder", () => {
        expect(splitProductTitleLines("  Endüstriyel   Plastik  Dişli   Kutusu  ")).toEqual({
            firstLine: "Endüstriyel Plastik",
            secondLine: "Dişli Kutusu",
        })
    })

    it("boş metinde iki satırı da boş döner", () => {
        expect(splitProductTitleLines("")).toEqual({
            firstLine: "",
            secondLine: "",
        })
    })
})
