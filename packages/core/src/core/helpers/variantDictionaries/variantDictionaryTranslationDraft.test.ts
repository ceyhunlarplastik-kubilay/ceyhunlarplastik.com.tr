import { describe, expect, it, vi } from "vitest"

import {
    VariantDictionaryTranslationDraftError,
    applyVariantDictionaryTranslationDraft,
    buildVariantDictionaryTranslationWrites,
    createVariantDictionaryTranslationDraft,
    type VariantDictionaryTranslationDraftStore,
} from "./variantDictionaryTranslationDraft"

function createMeasurementTypeDraft(translatedNames = ["Outside Diameter"]) {
    return createVariantDictionaryTranslationDraft({
        candidates: [{
            entity: "measurementType",
            measurementTypeId: "measurement-type-1",
            code: "D",
            sourceName: "Dış Çap",
        }],
        translatedNames,
        generatedAt: new Date("2026-07-23T12:00:00.000Z"),
        estimatedCharacters: 7,
        billedCharacters: 7,
    })
}

describe("variant dictionary translation drafts", () => {
    it("builds slugless writes for missing EN translations", () => {
        const draft = createVariantDictionaryTranslationDraft({
            candidates: [
                {
                    entity: "measurementType",
                    measurementTypeId: "measurement-type-1",
                    code: "D",
                    sourceName: "Dış Çap",
                },
                {
                    entity: "material",
                    materialId: "material-1",
                    code: "POM",
                    sourceName: "Poliasetal",
                },
                {
                    entity: "color",
                    colorId: "color-1",
                    system: "RAL",
                    code: "9005",
                    sourceName: "Siyah",
                },
            ],
            translatedNames: ["Outside Diameter", "Polyacetal", "Black"],
            generatedAt: new Date("2026-07-23T12:00:00.000Z"),
            estimatedCharacters: 23,
            billedCharacters: 23,
        })

        const writes = buildVariantDictionaryTranslationWrites({
            draft,
            measurementTypes: [{
                id: "measurement-type-1",
                code: "D",
                translations: [{ locale: "tr", name: "Dış Çap" }],
            }],
            materials: [{
                id: "material-1",
                code: "POM",
                translations: [{ locale: "tr", name: "Poliasetal" }],
            }],
            colors: [{
                id: "color-1",
                system: "RAL",
                code: "9005",
                translations: [{ locale: "tr", name: "Siyah" }],
            }],
        })

        expect(writes).toEqual({
            measurementTypes: [{
                measurementTypeId: "measurement-type-1",
                locale: "en",
                name: "Outside Diameter",
            }],
            materials: [{
                materialId: "material-1",
                locale: "en",
                name: "Polyacetal",
            }],
            colors: [{
                colorId: "color-1",
                locale: "en",
                name: "Black",
            }],
        })
    })

    it("rejects stale source fingerprints", () => {
        const draft = createMeasurementTypeDraft()

        expect(() => buildVariantDictionaryTranslationWrites({
            draft,
            measurementTypes: [{
                id: "measurement-type-1",
                code: "D",
                translations: [{ locale: "tr", name: "Dış çap" }],
            }],
            materials: [],
            colors: [],
        })).toThrow(VariantDictionaryTranslationDraftError)
    })

    it("rejects no-overwrite apply when EN already exists", async () => {
        const draft = createMeasurementTypeDraft()
        const store: VariantDictionaryTranslationDraftStore = {
            loadMeasurementTypes: vi.fn(async () => [{
                id: "measurement-type-1",
                code: "D",
                translations: [
                    { locale: "tr", name: "Dış Çap" },
                    { locale: "en", name: "Outside Diameter" },
                ],
            }]),
            loadMaterials: vi.fn(async () => []),
            loadColors: vi.fn(async () => []),
            createManyAtomically: vi.fn(),
        }

        await expect(applyVariantDictionaryTranslationDraft({ draft, store }))
            .rejects.toThrow(VariantDictionaryTranslationDraftError)
        expect(store.createManyAtomically).not.toHaveBeenCalled()
    })
})
