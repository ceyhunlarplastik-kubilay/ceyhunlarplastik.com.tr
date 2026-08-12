import { describe, expect, it } from "vitest"

import { SUPPORTED_LOCALES } from "@core/i18n/locales"
import type { IndustrialUsageFunctionsPayload } from "@/features/admin/industrialUsageFunctions/api/types"
import { buildUsageFunctionImportDiff } from "./usageFunctionImportDiff"
import {
    buildUsageFunctionWorkbook,
    isUsageRowIncomplete,
    parseUsageFunctionWorkbook,
    selectExportRows,
} from "./usageFunctionWorkbook"
import {
    COLUMNS,
    FIRST_DATA_ROW,
    HEADER_ROW,
    META_ROWS,
    META_VALUE_COLUMN,
    SHEET_NAME,
    localeColumn,
} from "./usageFunctionWorkbookFormat"

/**
 * Yazma ve okuma aynı format modülünü paylaşıyor; bu test ikisinin GERÇEKTEN
 * aynı dosyada buluştuğunu kanıtlar. Sütun/satır numarası kayarsa burada patlar.
 */

const PRODUCT_ID = "3f9d0d4c-3e5d-4b6b-9a2f-1c2d3e4f5a6b"

function makePayload(): IndustrialUsageFunctionsPayload {
    return {
        product: {
            id: PRODUCT_ID,
            code: "10.11",
            slug: "11-serisi-bakalit-tutamaklar",
            name: "Bakalit Tutamak",
            categoryName: "Tutamaklar",
            names: { tr: "Bakalit Tutamak", en: "Bakelite Handle" },
        },
        taxonomy: {
            "sector-1": { tr: "Otomotiv", en: "Automotive" },
            "group-1": { tr: "Gövde Üretimi" },
            "area-1": { tr: "Kaporta Hattı", en: "Body Line" },
        },
        rows: [
            {
                usageId: "11111111-1111-4111-8111-111111111111",
                displayOrder: 0,
                sectorValueId: "sector-1",
                productionGroupValueId: "group-1",
                usageAreaValueId: "area-1",
                usageFunctions: { tr: "Türkçe kullanım fonksiyonu", en: "English usage function" },
            },
            {
                usageId: "22222222-2222-4222-8222-222222222222",
                displayOrder: 1,
                sectorValueId: "sector-1",
                productionGroupValueId: null,
                usageAreaValueId: null,
                usageFunctions: { tr: "Sadece Türkçe" },
            },
        ],
    }
}

async function loadWorkbook(buffer: ArrayBuffer) {
    const ExcelJS = (await import("exceljs")).default
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    return workbook
}

/** xlsx bir zip; koruma iddiasını ham sayfa XML'inden okuruz (jszip exceljs ile gelir). */
async function readSheetProtectionXml(buffer: ArrayBuffer) {
    const JSZip = (await import("jszip")).default
    const zip = await JSZip.loadAsync(buffer)
    const xml = await zip.file("xl/worksheets/sheet1.xml")!.async("string")

    return /<sheetProtection[^>]*>/.exec(xml)?.[0] ?? ""
}

async function buildAndParse(options: { onlyMissing?: boolean } = {}) {
    const payload = makePayload()
    const built = await buildUsageFunctionWorkbook({
        payload,
        onlyMissing: options.onlyMissing ?? false,
        exportedAt: new Date("2026-08-11T09:30:00.000Z"),
    })

    const parsed = await parseUsageFunctionWorkbook(built.buffer as ArrayBuffer)

    return { payload, parsed, ...built }
}

describe("usageFunctionWorkbook round-trip", () => {
    it("tek sayfa üretir ve tüm dilleri sütun olarak tanır", async () => {
        const { parsed } = await buildAndParse()

        expect(parsed.sheetName).toBe(SHEET_NAME)
        expect(parsed.locales).toEqual([...SUPPORTED_LOCALES])
        expect(parsed.unreadableColumns).toEqual([])
    })

    it("meta bloktan ürün kimliğini geri okur", async () => {
        const { parsed } = await buildAndParse()

        expect(parsed.productId).toBe(PRODUCT_ID)
        expect(parsed.productCode).toBe("10.11")
    })

    it("bir satırın tüm dil hücrelerini aynı satırda toplar", async () => {
        const { payload, parsed } = await buildAndParse()

        expect(parsed.rows.map((row) => row.usageId)).toEqual(
            payload.rows.map((row) => row.usageId),
        )
        expect(parsed.rows[0].usageFunctions).toEqual({
            tr: "Türkçe kullanım fonksiyonu",
            en: "English usage function",
        })
        expect(parsed.rows[1].usageFunctions).toEqual({ tr: "Sadece Türkçe" })
    })

    it("dokunulmamış dosya geri yüklendiğinde hiçbir değişiklik üretmez", async () => {
        const { payload, parsed } = await buildAndParse()

        const diff = buildUsageFunctionImportDiff({ parsed, current: payload })

        expect(diff.errors).toEqual([])
        expect(diff.changes).toEqual([])
        expect(diff.rows).toEqual([])
    })

    it("doldurulan hücreler doğru dile eşlenir", async () => {
        const { payload, buffer } = await buildAndParse()

        const workbook = await loadWorkbook(buffer as ArrayBuffer)
        const sheet = workbook.worksheets[0]
        sheet.getCell(FIRST_DATA_ROW, localeColumn("de")).value = "Deutscher Text"
        sheet.getCell(FIRST_DATA_ROW, localeColumn("ar")).value = "نص عربي"

        const edited = await workbook.xlsx.writeBuffer()
        const parsed = await parseUsageFunctionWorkbook(edited as ArrayBuffer)
        const diff = buildUsageFunctionImportDiff({ parsed, current: payload })

        expect(diff.errors).toEqual([])
        expect(diff.rows).toEqual([
            {
                usageId: payload.rows[0].usageId,
                usageFunctions: { de: "Deutscher Text", ar: "نص عربي" },
            },
        ])
    })

    it("ürün bilgilerini ve bağlam sütunlarını kilitli, dil sütunlarını yazılabilir bırakır", async () => {
        const { buffer } = await buildAndParse()

        const sheet = (await loadWorkbook(buffer as ArrayBuffer)).worksheets[0]

        // Ürün bilgileri (meta blok) — değiştirilemez.
        expect(sheet.getCell(META_ROWS.productId, META_VALUE_COLUMN).protection?.locked).not.toBe(
            false,
        )
        expect(sheet.getCell(META_ROWS.productName, META_VALUE_COLUMN).protection?.locked).not.toBe(
            false,
        )
        // Kimlik ve bağlam sütunları — değiştirilemez.
        expect(sheet.getCell(FIRST_DATA_ROW, COLUMNS.usageId).protection?.locked).not.toBe(false)
        expect(sheet.getCell(FIRST_DATA_ROW, COLUMNS.usageArea).protection?.locked).not.toBe(false)
        expect(sheet.getCell(HEADER_ROW, COLUMNS.sector).protection?.locked).not.toBe(false)
        // Dil sütunları — yazılabilir.
        expect(sheet.getCell(FIRST_DATA_ROW, localeColumn("tr")).protection?.locked).toBe(false)
        expect(sheet.getCell(FIRST_DATA_ROW, localeColumn("hi")).protection?.locked).toBe(false)
    })

    it("makine-kritik alanları gizler — görünmeyen hücre kazara düzenlenmez", async () => {
        const { buffer } = await buildAndParse()

        const sheet = (await loadWorkbook(buffer as ArrayBuffer)).worksheets[0]

        expect(sheet.getColumn(COLUMNS.usageId).hidden).toBe(true)
        expect(sheet.getRow(META_ROWS.productId).hidden).toBe(true)
        // İnsanın okuması gereken kimlik görünür kalır.
        expect(sheet.getRow(META_ROWS.productCode).hidden).not.toBe(true)
        expect(sheet.getRow(META_ROWS.productName).hidden).not.toBe(true)
        expect(sheet.getColumn(COLUMNS.usageArea).hidden).not.toBe(true)
    })

    it("gizli alanlar gizliyken de sorunsuz geri okunur", async () => {
        const { parsed } = await buildAndParse()

        expect(parsed.productId).toBe(PRODUCT_ID)
        expect(parsed.rows[0].usageId).toBe("11111111-1111-4111-8111-111111111111")
    })

    /**
     * Koruma iddiası exceljs'in kendi modeli üzerinden doğrulanamaz: exceljs
     * OOXML varsayılanına eşit bayrakları dosyaya HİÇ yazmaz ve geri okurken
     * `undefined` verir. Anlamlı olan üretilen XML'in kendisi, o yüzden dosyayı
     * açıp `sheetProtection` elemanını okuyoruz.
     *
     * OOXML kuralı: bu bayraklar YAZILMADIĞINDA "kilitli" varsayılır;
     * `attr="0"` ise o eylem serbesttir.
     */
    it("sayfa korumasını gerçekten dosyaya yazar ve biçim değişikliğini kilitler", async () => {
        const { buffer } = await buildAndParse()

        const protection = await readSheetProtectionXml(buffer as ArrayBuffer)

        expect(protection).toContain('sheet="1"')
        // Serbest bırakılan TEK eylem filtreleme — veriyi değiştirmez.
        expect(protection).toContain('autoFilter="0"')
        // Gizli kimlik sütunu Excel'de kazara açılamasın: bu bayraklar yazılmaz
        // (= kilitli). Serbest bırakılsalardı `="0"` olarak görünürlerdi.
        expect(protection).not.toContain('formatColumns="0"')
        expect(protection).not.toContain('formatCells="0"')
        expect(protection).not.toContain('formatRows="0"')
        expect(protection).not.toContain('sort="0"')
    })

    it("tablo biçimlendirmesi uygular: kenarlık, zebra, donmuş bölme", async () => {
        const { buffer } = await buildAndParse()

        const sheet = (await loadWorkbook(buffer as ArrayBuffer)).worksheets[0]

        const firstRowCell = sheet.getCell(FIRST_DATA_ROW, COLUMNS.sector)
        const secondRowCell = sheet.getCell(FIRST_DATA_ROW + 1, COLUMNS.sector)

        expect(firstRowCell.border?.top?.style).toBe("thin")
        // Zebra: ardışık iki satırın dolgusu farklı.
        expect(firstRowCell.fill).not.toEqual(secondRowCell.fill)

        const [view] = sheet.views
        expect(view.state).toBe("frozen")
        expect(view).toMatchObject({ xSplit: COLUMNS.usageArea, ySplit: HEADER_ROW })
    })

    it("taksonomi adlarını Türkçe yazar, bağlanmamış alanlarda tire koyar", async () => {
        const { buffer } = await buildAndParse()

        const sheet = (await loadWorkbook(buffer as ArrayBuffer)).worksheets[0]

        expect(sheet.getCell(FIRST_DATA_ROW, COLUMNS.sector).value).toBe("Otomotiv")
        expect(sheet.getCell(FIRST_DATA_ROW, COLUMNS.productionGroup).value).toBe("Gövde Üretimi")
        expect(sheet.getCell(FIRST_DATA_ROW + 1, COLUMNS.productionGroup).value).toBe("-")
    })

    it("başlığı bozulan dil sütununu okumaz, uyarı için biriktirir", async () => {
        const { payload, buffer } = await buildAndParse()

        const workbook = await loadWorkbook(buffer as ArrayBuffer)
        const sheet = workbook.worksheets[0]
        sheet.getCell(HEADER_ROW, localeColumn("de")).value = "Almanca"
        sheet.getCell(FIRST_DATA_ROW, localeColumn("de")).value = "Deutscher Text"

        const edited = await workbook.xlsx.writeBuffer()
        const parsed = await parseUsageFunctionWorkbook(edited as ArrayBuffer)

        expect(parsed.locales).not.toContain("de")
        expect(parsed.unreadableColumns).toContain("Almanca")

        const diff = buildUsageFunctionImportDiff({ parsed, current: payload })
        expect(diff.warnings[0]).toContain("Almanca")
        expect(diff.rows).toEqual([])
    })

    it("anlamlı dosya adı üretir", async () => {
        const { fileName, localeCount } = await buildAndParse()

        expect(fileName).toContain("kullanim-fonksiyonu")
        expect(fileName).toContain("10-11")
        expect(fileName).toContain(PRODUCT_ID)
        expect(fileName.endsWith(".xlsx")).toBe(true)
        expect(localeCount).toBe(SUPPORTED_LOCALES.length)
    })
})

describe("selectExportRows", () => {
    it("varsayılan olarak tüm satırları aktarır", () => {
        expect(selectExportRows(makePayload(), false)).toHaveLength(2)
    })

    it("eksik filtresinde tüm dilleri dolu olmayan satırlar kalır", () => {
        expect(selectExportRows(makePayload(), true)).toHaveLength(2)
    })

    it("14 dili de dolu olan satır eksik sayılmaz", () => {
        const complete = Object.fromEntries(
            SUPPORTED_LOCALES.map((locale) => [locale, `metin-${locale}`]),
        )

        expect(isUsageRowIncomplete(complete)).toBe(false)
        expect(isUsageRowIncomplete({ ...complete, hi: "  " })).toBe(true)
    })
})
