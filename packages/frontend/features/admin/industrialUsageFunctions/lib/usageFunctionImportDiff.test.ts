import { describe, expect, it } from "vitest"

import type { IndustrialUsageFunctionsPayload } from "@/features/admin/industrialUsageFunctions/api/types"
import {
    buildUsageFunctionImportDiff,
    type ParsedUsageFunctionRow,
    type ParsedUsageFunctionWorkbook,
} from "./usageFunctionImportDiff"
import { SHEET_NAME, USAGE_FUNCTION_MAX_LENGTH } from "./usageFunctionWorkbookFormat"

const PRODUCT_ID = "3f9d0d4c-3e5d-4b6b-9a2f-1c2d3e4f5a6b"

function makeCurrent(): IndustrialUsageFunctionsPayload {
    return {
        product: {
            id: PRODUCT_ID,
            code: "10.11",
            slug: "bakalit-tutamak",
            name: "Bakalit Tutamak",
            categoryName: "Tutamaklar",
            names: { tr: "Bakalit Tutamak", en: "Bakelite Handle" },
        },
        taxonomy: {},
        rows: [
            {
                usageId: "usage-1",
                displayOrder: 0,
                sectorValueId: null,
                productionGroupValueId: null,
                usageAreaValueId: null,
                usageFunctions: { tr: "Türkçe metin", en: "Existing english" },
            },
            {
                usageId: "usage-2",
                displayOrder: 1,
                sectorValueId: null,
                productionGroupValueId: null,
                usageAreaValueId: null,
                usageFunctions: {},
            },
        ],
    }
}

function makeParsed(
    rows: ParsedUsageFunctionRow[],
    overrides: Partial<ParsedUsageFunctionWorkbook> = {},
): ParsedUsageFunctionWorkbook {
    return {
        sheetName: SHEET_NAME,
        productId: PRODUCT_ID,
        productCode: "10.11",
        locales: ["tr", "en", "de"],
        unreadableColumns: [],
        rows,
        ...overrides,
    }
}

describe("buildUsageFunctionImportDiff", () => {
    it("aynı satırdaki farklı dil sütunlarını tek gövdede birleştirir", () => {
        const diff = buildUsageFunctionImportDiff({
            parsed: makeParsed([
                {
                    excelRow: 9,
                    usageId: "usage-1",
                    usageFunctions: { en: "Updated english", de: "Deutscher Text" },
                },
            ]),
            current: makeCurrent(),
        })

        expect(diff.errors).toEqual([])
        expect(diff.changes.map((change) => change.kind)).toEqual(["updated", "created"])
        expect(diff.rows).toEqual([
            {
                usageId: "usage-1",
                usageFunctions: { en: "Updated english", de: "Deutscher Text" },
            },
        ])
        expect(diff.touchedRows).toBe(1)
    })

    it("aynı metni değişiklik saymaz", () => {
        const diff = buildUsageFunctionImportDiff({
            parsed: makeParsed([
                {
                    excelRow: 9,
                    usageId: "usage-1",
                    usageFunctions: { en: "  Existing english  " },
                },
            ]),
            current: makeCurrent(),
        })

        expect(diff.changes).toEqual([])
        expect(diff.unchanged).toBe(1)
        expect(diff.rows).toEqual([])
    })

    it("boş hücreyi atlar — silme üretmez", () => {
        const diff = buildUsageFunctionImportDiff({
            parsed: makeParsed([
                { excelRow: 9, usageId: "usage-1", usageFunctions: { en: "   " } },
            ]),
            current: makeCurrent(),
        })

        expect(diff.errors).toEqual([])
        expect(diff.changes).toEqual([])
        expect(diff.rows).toEqual([])
    })

    it("başka ürüne ait dosyayı reddeder ve hiçbir satır göndermez", () => {
        const diff = buildUsageFunctionImportDiff({
            parsed: makeParsed(
                [{ excelRow: 9, usageId: "usage-1", usageFunctions: { en: "Updated" } }],
                { productId: "8a7b6c5d-4e3f-4a2b-8c9d-0e1f2a3b4c5d", productCode: "20.22" },
            ),
            current: makeCurrent(),
        })

        expect(diff.errors[0]).toContain("başka bir ürüne ait")
        expect(diff.errors[0]).toContain("20.22")
        expect(diff.rows).toEqual([])
    })

    it("ürün bilgisi silinmiş dosyayı reddeder", () => {
        const diff = buildUsageFunctionImportDiff({
            parsed: makeParsed(
                [{ excelRow: 9, usageId: "usage-1", usageFunctions: { en: "Updated" } }],
                { productId: null },
            ),
            current: makeCurrent(),
        })

        expect(diff.errors[0]).toContain("Ürün ID bulunamadı")
        expect(diff.rows).toEqual([])
    })

    it("üründe olmayan kullanım satırını hata olarak bildirir", () => {
        const diff = buildUsageFunctionImportDiff({
            parsed: makeParsed([
                { excelRow: 14, usageId: "silinmis", usageFunctions: { en: "Metin" } },
            ]),
            current: makeCurrent(),
        })

        expect(diff.errors[0]).toContain("Satır 14")
        expect(diff.rows).toEqual([])
    })

    it("TR sütunu boş olan satıra çeviri yazılmasını engeller", () => {
        const diff = buildUsageFunctionImportDiff({
            parsed: makeParsed([
                { excelRow: 10, usageId: "usage-2", usageFunctions: { en: "English" } },
            ]),
            current: makeCurrent(),
        })

        expect(diff.errors[0]).toContain("Türkçe sütunu doldurulmadan")
        expect(diff.rows).toEqual([])
    })

    it("TR aynı satırda doldurulmuşsa çeviriye izin verir", () => {
        const diff = buildUsageFunctionImportDiff({
            parsed: makeParsed([
                {
                    excelRow: 10,
                    usageId: "usage-2",
                    usageFunctions: { tr: "Türkçe", en: "English" },
                },
            ]),
            current: makeCurrent(),
        })

        expect(diff.errors).toEqual([])
        expect(diff.rows).toEqual([
            { usageId: "usage-2", usageFunctions: { tr: "Türkçe", en: "English" } },
        ])
    })

    it("karakter sınırını aşan metni reddeder", () => {
        const diff = buildUsageFunctionImportDiff({
            parsed: makeParsed([
                {
                    excelRow: 9,
                    usageId: "usage-1",
                    usageFunctions: { en: "a".repeat(USAGE_FUNCTION_MAX_LENGTH + 1) },
                },
            ]),
            current: makeCurrent(),
        })

        expect(diff.errors[0]).toContain("karakter sınırını aşıyor")
        expect(diff.errors[0]).toContain("İngilizce")
    })

    it("dil kodu okunamayan sütunu uyarıyla atlar", () => {
        const diff = buildUsageFunctionImportDiff({
            parsed: makeParsed(
                [{ excelRow: 9, usageId: "usage-1", usageFunctions: { en: "Updated" } }],
                { unreadableColumns: ["Notlar"] },
            ),
            current: makeCurrent(),
        })

        expect(diff.warnings[0]).toContain("Notlar")
        expect(diff.errors).toEqual([])
        expect(diff.changes).toHaveLength(1)
    })

    it("hiç tanınan dil sütunu yoksa hata verir", () => {
        const diff = buildUsageFunctionImportDiff({
            parsed: makeParsed([], { locales: [] }),
            current: makeCurrent(),
        })

        expect(diff.errors[0]).toContain("tanınan bir dil sütunu yok")
    })

    it("ID'si silinmiş ama metni yazılmış satırı yakalar", () => {
        const diff = buildUsageFunctionImportDiff({
            parsed: makeParsed([
                { excelRow: 15, usageId: "", usageFunctions: { en: "Metin" } },
            ]),
            current: makeCurrent(),
        })

        expect(diff.errors[0]).toContain("Kullanım Satırı ID")
    })

    it("aynı kullanım satırının iki kez yazılmasını reddeder", () => {
        const diff = buildUsageFunctionImportDiff({
            parsed: makeParsed([
                { excelRow: 9, usageId: "usage-1", usageFunctions: { en: "A" } },
                { excelRow: 10, usageId: "usage-1", usageFunctions: { de: "B" } },
            ]),
            current: makeCurrent(),
        })

        expect(diff.errors[0]).toContain("birden fazla kez")
    })
})
