import { describe, expect, it } from "vitest"

import { SUPPORTED_LOCALES } from "@core/i18n/locales"
import {
    FIRST_LOCALE_COLUMN,
    SHEET_NAME,
    buildUsageFunctionFileName,
    lastColumn,
    localeColumn,
    localeColumnHeader,
    orderedLocales,
    parseLocaleCode,
    parseLocaleColumnHeader,
    slugifyForFileName,
} from "./usageFunctionWorkbookFormat"

const PRODUCT_ID = "3f9d0d4c-3e5d-4b6b-9a2f-1c2d3e4f5a6b"

describe("sayfa ve sütun yerleşimi", () => {
    it("tek sayfa kullanır ve adı Excel'in 31 karakter sınırına sığar", () => {
        expect(SHEET_NAME).toBe("Kullanım Fonksiyonları")
        expect(SHEET_NAME.length).toBeLessThanOrEqual(31)
    })

    it("ilk dil sütunu Türkçe, ikincisi İngilizce", () => {
        expect(orderedLocales()[0]).toBe("tr")
        expect(orderedLocales()[1]).toBe("en")
        expect(localeColumn("tr")).toBe(FIRST_LOCALE_COLUMN)
        expect(localeColumn("en")).toBe(FIRST_LOCALE_COLUMN + 1)
    })

    it("her dile benzersiz bir sütun düşer", () => {
        const columns = SUPPORTED_LOCALES.map((locale) => localeColumn(locale))

        expect(new Set(columns).size).toBe(SUPPORTED_LOCALES.length)
        expect(Math.max(...columns)).toBe(lastColumn())
    })
})

describe("localeColumnHeader / parseLocaleColumnHeader", () => {
    it("başlık Türkçe dil adı ve kod taşır", () => {
        expect(localeColumnHeader("tr")).toBe("Türkçe (tr)")
        expect(localeColumnHeader("en")).toBe("İngilizce (en)")
        expect(localeColumnHeader("ar")).toBe("Arapça (ar)")
    })

    it("ürettiği her başlığı geri okuyabilir", () => {
        for (const locale of SUPPORTED_LOCALES) {
            expect(parseLocaleColumnHeader(localeColumnHeader(locale))).toBe(locale)
        }
    })

    it("dil kodu taşımayan başlıkta null döner — sessiz tahmin yok", () => {
        expect(parseLocaleColumnHeader("Notlar")).toBeNull()
        expect(parseLocaleColumnHeader("Kullanım Fonksiyonu")).toBeNull()
        expect(parseLocaleColumnHeader("Klingonca (kl)")).toBeNull()
        expect(parseLocaleColumnHeader(42)).toBeNull()
    })
})

describe("slugifyForFileName", () => {
    it("Türkçe karakterleri sadeleştirir", () => {
        expect(slugifyForFileName("11 Serisi Burç Bağlantılı Elçik")).toBe(
            "11-serisi-burc-baglantili-elcik",
        )
    })

    it("baştaki ve sondaki tireleri temizler", () => {
        expect(slugifyForFileName("  --Ürün--  ")).toBe("urun")
    })
})

describe("buildUsageFunctionFileName", () => {
    it("ürün kodu, slug, ID ve tarih taşır", () => {
        const fileName = buildUsageFunctionFileName({
            productCode: "10.11",
            productSlug: "11-serisi-bakalit-tutamaklar",
            productId: PRODUCT_ID,
            exportedAt: new Date("2026-08-11T09:30:00.000Z"),
        })

        expect(fileName).toBe(
            `kullanim-fonksiyonu_10-11_11-serisi-bakalit-tutamaklar_${PRODUCT_ID}_2026-08-11.xlsx`,
        )
    })

    it("boş slug'da bile geçerli bir ad üretir", () => {
        const fileName = buildUsageFunctionFileName({
            productCode: "",
            productSlug: "",
            productId: PRODUCT_ID,
            exportedAt: new Date("2026-08-11T09:30:00.000Z"),
        })

        expect(fileName).toBe(`kullanim-fonksiyonu_urun_model_${PRODUCT_ID}_2026-08-11.xlsx`)
    })
})

describe("parseLocaleCode", () => {
    it("desteklenen dili normalize ederek okur", () => {
        expect(parseLocaleCode(" TR ")).toBe("tr")
        expect(parseLocaleCode("en")).toBe("en")
    })

    it("desteklenmeyen değerde null döner", () => {
        expect(parseLocaleCode("xx")).toBeNull()
        expect(parseLocaleCode(42)).toBeNull()
        expect(parseLocaleCode(null)).toBeNull()
    })
})
