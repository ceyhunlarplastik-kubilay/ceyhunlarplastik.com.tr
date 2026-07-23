import { describe, expect, it } from "vitest"

import {
    localizeColor,
    localizeMaterial,
    localizeMeasurementType,
} from "./localizeVariantDictionary"

const now = new Date("2026-07-23T12:00:00.000Z")

describe("variant dictionary localizers", () => {
    it("localizes a measurement type with the requested translation", () => {
        const localized = localizeMeasurementType({
            id: "measurement-type-1",
            code: "D",
            name: "Dış Çap",
            baseUnit: "mm",
            displayOrder: 0,
            createdAt: now,
            updatedAt: now,
            translations: [
                {
                    id: "measurement-type-1-tr",
                    measurementTypeId: "measurement-type-1",
                    locale: "tr",
                    name: "Dış Çap",
                    createdAt: now,
                    updatedAt: now,
                },
                {
                    id: "measurement-type-1-en",
                    measurementTypeId: "measurement-type-1",
                    locale: "en",
                    name: "Outside Diameter",
                    createdAt: now,
                    updatedAt: now,
                },
            ],
        }, "en")

        expect(localized.name).toBe("Outside Diameter")
        expect(localized.resolvedLocale).toBe("en")
        expect(localized.translationMissing).toBe(false)
    })

    it("falls back to Turkish material translation when English is missing", () => {
        const localized = localizeMaterial({
            id: "material-1",
            code: "POM",
            name: "Poliasetal",
            createdAt: now,
            updatedAt: now,
            translations: [{
                id: "material-1-tr",
                materialId: "material-1",
                locale: "tr",
                name: "Poliasetal",
                createdAt: now,
                updatedAt: now,
            }],
        }, "en")

        expect(localized.name).toBe("Poliasetal")
        expect(localized.resolvedLocale).toBe("tr")
        expect(localized.translationMissing).toBe(true)
    })

    it("localizes a color without changing invariant fields", () => {
        const localized = localizeColor({
            id: "color-1",
            system: "RAL",
            code: "9005",
            name: "Siyah",
            hex: "#000000",
            rgbR: 0,
            rgbG: 0,
            rgbB: 0,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            translations: [
                {
                    id: "color-1-tr",
                    colorId: "color-1",
                    locale: "tr",
                    name: "Siyah",
                    createdAt: now,
                    updatedAt: now,
                },
                {
                    id: "color-1-en",
                    colorId: "color-1",
                    locale: "en",
                    name: "Black",
                    createdAt: now,
                    updatedAt: now,
                },
            ],
        }, "en")

        expect(localized.name).toBe("Black")
        expect(localized.system).toBe("RAL")
        expect(localized.code).toBe("9005")
        expect(localized.hex).toBe("#000000")
    })
})
