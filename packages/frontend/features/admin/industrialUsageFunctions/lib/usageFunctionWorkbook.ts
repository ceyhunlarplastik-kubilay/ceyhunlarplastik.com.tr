import type { Borders, Worksheet } from "exceljs"

import { DEFAULT_LOCALE, type SupportedLocale } from "@core/i18n/locales"
import type { IndustrialUsageFunctionsPayload } from "@/features/admin/industrialUsageFunctions/api/types"
import type {
    ParsedUsageFunctionRow,
    ParsedUsageFunctionWorkbook,
} from "./usageFunctionImportDiff"
import {
    COLUMNS,
    COLUMN_HEADERS,
    CONTEXT_COLUMN_WIDTHS,
    FIRST_DATA_ROW,
    FIRST_LOCALE_COLUMN,
    HEADER_ROW,
    LOCALE_COLUMN_WIDTH,
    META_LABELS,
    META_LABEL_COLUMN,
    META_ROWS,
    META_VALUE_COLUMN,
    SHEET_NAME,
    SHEET_NOTE,
    buildUsageFunctionFileName,
    lastColumn,
    localeColumnHeader,
    orderedLocales,
    parseLocaleColumnHeader,
} from "./usageFunctionWorkbookFormat"

/**
 * Excel yazma/okuma — exceljs YALNIZ burada, hep `await import()` ile.
 * Kütüphane ~1MB; panel ilk yükünde inmesin diye dışa/içe aktarma tıklanana
 * kadar ayrı chunk'ta bekler.
 *
 * exceljs tarayıcıda package.json'ın `browser` alanı üzerinden tek parça hazır
 * bundle'a (`dist/exceljs.min.js`) çözülür; archiver/unzipper gibi node
 * bağımlılıkları bundle'a girmez.
 */

const COLOR = {
    ink: "FF111827",
    headerText: "FFFFFFFF",
    sourceHeader: "FF8A6D1F",
    border: "FFD8DEE7",
    contextOdd: "FFF6F8FA",
    contextEven: "FFECF0F5",
    contextText: "FF64748B",
    editableOdd: "FFFFFFFF",
    editableEven: "FFFBFAF4",
    sourceOdd: "FFFFFDF6",
    sourceEven: "FFFAF6E9",
    metaLabel: "FFF1F5F9",
    metaValue: "FFFFFFFF",
    noteText: "FF94A3B8",
} as const

const THIN_BORDER: Partial<Borders> = {
    top: { style: "thin", color: { argb: COLOR.border } },
    left: { style: "thin", color: { argb: COLOR.border } },
    bottom: { style: "thin", color: { argb: COLOR.border } },
    right: { style: "thin", color: { argb: COLOR.border } },
}

export type BuildUsageFunctionWorkbookOptions = {
    payload: IndustrialUsageFunctionsPayload
    /** Yalnız en az bir dilde metni eksik olan satırlar aktarılsın mı? */
    onlyMissing: boolean
    exportedAt?: Date
}

function localizedName(
    names: Partial<Record<SupportedLocale, string>>,
    locale: SupportedLocale,
    fallback: string,
) {
    return names[locale] ?? names[DEFAULT_LOCALE] ?? fallback
}

/** Bir satır, 14 dilin herhangi birinde metinsizse "eksik" sayılır. */
export function isUsageRowIncomplete(usageFunctions: Partial<Record<SupportedLocale, string>>) {
    return orderedLocales().some((locale) => !usageFunctions[locale]?.trim())
}

export function selectExportRows(payload: IndustrialUsageFunctionsPayload, onlyMissing: boolean) {
    if (!onlyMissing) return payload.rows
    return payload.rows.filter((row) => isUsageRowIncomplete(row.usageFunctions))
}

function fill(argb: string) {
    return { type: "pattern", pattern: "solid", fgColor: { argb } } as const
}

function writeMetaRow(sheet: Worksheet, row: number, label: string, value: string) {
    const labelCell = sheet.getCell(row, META_LABEL_COLUMN)
    labelCell.value = label
    labelCell.font = { bold: true, size: 10, color: { argb: COLOR.contextText } }
    labelCell.fill = fill(COLOR.metaLabel)
    labelCell.border = THIN_BORDER
    labelCell.alignment = { vertical: "middle" }

    sheet.mergeCells(row, META_VALUE_COLUMN, row, COLUMNS.usageArea)

    const valueCell = sheet.getCell(row, META_VALUE_COLUMN)
    valueCell.value = value
    valueCell.font = { size: 11, color: { argb: COLOR.ink } }
    valueCell.fill = fill(COLOR.metaValue)
    valueCell.border = THIN_BORDER
    valueCell.alignment = { vertical: "middle" }
}

export async function buildUsageFunctionWorkbook({
    payload,
    onlyMissing,
    exportedAt = new Date(),
}: BuildUsageFunctionWorkbookOptions) {
    const ExcelJS = (await import("exceljs")).default
    const workbook = new ExcelJS.Workbook()

    workbook.creator = "Ceyhunlar Plastik — Veri Girişi Paneli"
    workbook.created = exportedAt

    const rows = selectExportRows(payload, onlyMissing)
    const locales = orderedLocales()
    const finalColumn = lastColumn()

    const sheet = workbook.addWorksheet(SHEET_NAME, {
        // Başlık satırı VE sol bağlam bloğu sabit: 14 dil sütununda yatay
        // kaydırırken kullanıcı hangi satırda olduğunu kaybetmesin.
        views: [
            {
                state: "frozen",
                xSplit: COLUMNS.usageArea,
                ySplit: HEADER_ROW,
                showGridLines: false,
            },
        ],
    })

    sheet.columns = [
        ...CONTEXT_COLUMN_WIDTHS.map((width, index) => ({
            width,
            // Kullanım Satırı ID GİZLİ: koruma yalnız Excel/LibreOffice'te
            // uygulanır (Apple Numbers sayfa korumasını hiç desteklemez), ama
            // görünmeyen bir hücre hiçbir uygulamada kazara düzenlenmez.
            // İçe aktarma sütunu indeksten okuduğu için gizli olması sorun değil.
            hidden: index + 1 === COLUMNS.usageId,
        })),
        ...locales.map(() => ({ width: LOCALE_COLUMN_WIDTH })),
    ]

    /* ---------------- Meta blok (tamamı kilitli) ---------------- */

    sheet.mergeCells(META_ROWS.title, 1, META_ROWS.title, finalColumn)
    const titleCell = sheet.getCell(META_ROWS.title, 1)
    titleCell.value = META_LABELS.title
    titleCell.font = { bold: true, size: 14, color: { argb: COLOR.headerText } }
    titleCell.fill = fill(COLOR.ink)
    titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 }
    sheet.getRow(META_ROWS.title).height = 30

    writeMetaRow(sheet, META_ROWS.productId, META_LABELS.productId, payload.product.id)
    // Ürün ID satırı da gizli: insanın okuması gereken kimlik Kod ve Ad,
    // uuid yalnız içe aktarma doğrulaması için taşınıyor.
    sheet.getRow(META_ROWS.productId).hidden = true

    writeMetaRow(sheet, META_ROWS.productCode, META_LABELS.productCode, payload.product.code)
    writeMetaRow(sheet, META_ROWS.productName, META_LABELS.productName, payload.product.name)
    writeMetaRow(sheet, META_ROWS.exportedAt, META_LABELS.exportedAt, exportedAt.toISOString())

    sheet.mergeCells(META_ROWS.note, 1, META_ROWS.note, finalColumn)
    const noteCell = sheet.getCell(META_ROWS.note, 1)
    noteCell.value = SHEET_NOTE
    noteCell.font = { size: 10, italic: true, color: { argb: COLOR.noteText } }
    noteCell.alignment = { vertical: "middle" }
    sheet.getRow(META_ROWS.note).height = 22

    /* ---------------- Başlık satırı ---------------- */

    const headerValues = [
        COLUMN_HEADERS.order,
        COLUMN_HEADERS.usageId,
        COLUMN_HEADERS.sector,
        COLUMN_HEADERS.productionGroup,
        COLUMN_HEADERS.usageArea,
        ...locales.map((locale) => localeColumnHeader(locale)),
    ]

    headerValues.forEach((value, index) => {
        const column = index + 1
        const cell = sheet.getCell(HEADER_ROW, column)
        const isSourceLocale = column === FIRST_LOCALE_COLUMN

        cell.value = value
        cell.font = { bold: true, size: 11, color: { argb: COLOR.headerText } }
        // Kaynak dil (Türkçe) sütunu farklı renkte: çeviriler ondan üretilir.
        cell.fill = fill(isSourceLocale ? COLOR.sourceHeader : COLOR.ink)
        cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true }
        cell.border = THIN_BORDER
    })
    sheet.getRow(HEADER_ROW).height = 30

    /* ---------------- Veri satırları ---------------- */

    rows.forEach((row, rowIndex) => {
        const excelRow = FIRST_DATA_ROW + rowIndex
        const isEvenRow = rowIndex % 2 === 1

        const taxonomyName = (valueId: string | null) =>
            valueId ? localizedName(payload.taxonomy[valueId] ?? {}, DEFAULT_LOCALE, "-") : "-"

        const contextValues: Array<string | number> = [
            rowIndex + 1,
            row.usageId,
            taxonomyName(row.sectorValueId),
            taxonomyName(row.productionGroupValueId),
            taxonomyName(row.usageAreaValueId),
        ]

        contextValues.forEach((value, index) => {
            const column = index + 1
            const cell = sheet.getCell(excelRow, column)

            cell.value = value
            cell.fill = fill(isEvenRow ? COLOR.contextEven : COLOR.contextOdd)
            cell.border = THIN_BORDER
            cell.font = {
                size: column === COLUMNS.usageId ? 8 : 10,
                color: { argb: COLOR.contextText },
            }
            cell.alignment = {
                vertical: "top",
                horizontal: column === COLUMNS.order ? "center" : "left",
                // ID sütunu sarmalanmaz: uuid satır yüksekliğini şişirmesin.
                wrapText: column !== COLUMNS.order && column !== COLUMNS.usageId,
            }
        })

        locales.forEach((locale, localeIndex) => {
            const column = FIRST_LOCALE_COLUMN + localeIndex
            const isSourceLocale = locale === DEFAULT_LOCALE
            const cell = sheet.getCell(excelRow, column)

            cell.value = row.usageFunctions[locale] ?? ""
            // Sayfa koruması altında YALNIZ dil sütunları yazılabilir kalır.
            cell.protection = { locked: false }
            cell.fill = fill(
                isSourceLocale
                    ? isEvenRow
                        ? COLOR.sourceEven
                        : COLOR.sourceOdd
                    : isEvenRow
                        ? COLOR.editableEven
                        : COLOR.editableOdd,
            )
            cell.border = THIN_BORDER
            cell.font = { size: 10, color: { argb: COLOR.ink } }
            cell.alignment = { vertical: "top", wrapText: true }
        })
    })

    if (rows.length > 0) {
        sheet.autoFilter = {
            from: { row: HEADER_ROW, column: 1 },
            to: { row: FIRST_DATA_ROW + rows.length - 1, column: finalColumn },
        }
    }

    // Şifresiz koruma: ürün bilgileri, kimlik ve taksonomi sütunları kazara
    // değiştirilemez. Gerekirse Excel'de "Sayfa Korumasını Kaldır" tek tık
    // (parola sormaz).
    //
    // `formatColumns: false` bilinçli: gizlenen kimlik sütunu Excel'de kazara
    // geri açılamasın. Yazılmayan insertRows/deleteRows gibi bayraklar OOXML'de
    // zaten KİLİTLİ varsayılır, ayrıca kapatmaya gerek yok.
    // `autoFilter` açık kalır — filtrelemek veriyi değiştirmez, eksik hücreleri
    // bulmanın en pratik yolu.
    await sheet.protect("", {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        sort: false,
        autoFilter: true,
    })

    const buffer = await workbook.xlsx.writeBuffer()

    return {
        buffer,
        rowCount: rows.length,
        localeCount: locales.length,
        fileName: buildUsageFunctionFileName({
            productCode: payload.product.code,
            productSlug: payload.product.slug,
            productId: payload.product.id,
            exportedAt,
        }),
    }
}

function readCellText(sheet: Worksheet, row: number, column: number) {
    const value = sheet.getCell(row, column).value

    if (value === null || value === undefined) return ""
    if (typeof value === "string") return value
    if (typeof value === "number" || typeof value === "boolean") return String(value)

    // Zengin metin / formül hücreleri: kullanıcı başka bir dosyadan yapıştırınca
    // exceljs düz string yerine nesne döndürür.
    if (typeof value === "object") {
        if ("richText" in value && Array.isArray(value.richText)) {
            return value.richText.map((part) => part.text).join("")
        }
        if ("text" in value && typeof value.text === "string") return value.text
        if ("result" in value && value.result !== undefined) return String(value.result)
    }

    return ""
}

export async function parseUsageFunctionWorkbook(
    file: ArrayBuffer,
): Promise<ParsedUsageFunctionWorkbook> {
    const ExcelJS = (await import("exceljs")).default
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(file)

    // Tek sayfalık format; kullanıcı sayfa eklemiş olsa bile veri ilk sayfada.
    const sheet = workbook.worksheets[0]

    if (!sheet) {
        return {
            sheetName: "",
            productId: null,
            productCode: null,
            locales: [],
            unreadableColumns: [],
            rows: [],
        }
    }

    const productId = readCellText(sheet, META_ROWS.productId, META_VALUE_COLUMN).trim() || null
    const productCode = readCellText(sheet, META_ROWS.productCode, META_VALUE_COLUMN).trim() || null

    const localeByColumn = new Map<number, SupportedLocale>()
    const unreadableColumns: string[] = []
    const finalColumn = Math.max(sheet.columnCount, lastColumn())

    for (let column = FIRST_LOCALE_COLUMN; column <= finalColumn; column += 1) {
        const header = readCellText(sheet, HEADER_ROW, column).trim()
        if (!header) continue

        const locale = parseLocaleColumnHeader(header)
        if (locale && !localeByColumn.has(column)) {
            localeByColumn.set(column, locale)
        } else if (!locale) {
            unreadableColumns.push(header)
        }
    }

    const rows: ParsedUsageFunctionRow[] = []

    for (let excelRow = FIRST_DATA_ROW; excelRow <= sheet.rowCount; excelRow += 1) {
        const usageId = readCellText(sheet, excelRow, COLUMNS.usageId).trim()
        const usageFunctions: ParsedUsageFunctionRow["usageFunctions"] = {}
        let hasText = false

        for (const [column, locale] of localeByColumn) {
            const text = readCellText(sheet, excelRow, column)
            if (!text.trim()) continue

            usageFunctions[locale] = text
            hasText = true
        }

        if (!usageId && !hasText) continue

        rows.push({ excelRow, usageId, usageFunctions })
    }

    return {
        sheetName: sheet.name,
        productId,
        productCode,
        locales: [...localeByColumn.values()],
        unreadableColumns,
        rows,
    }
}
