import { describe, expect, it } from "vitest"
import { transpileSchema } from "@middy/validator/transpile"

import { SUPPORTED_LOCALES, TARGET_LOCALES } from "@/core/i18n/locales"
import {
    localeSchema,
    targetLocaleSchema,
    REMOVABLE_TRANSLATION_LOCALES_MAX,
    TRANSLATIONS_ARRAY_MAX,
} from "@/core/helpers/validation/localeSchema"
import { slugValidator } from "./products"
import { updateCategoryValidator } from "@/functions/AdminApi/validators/categories"

// transpileSchema Ajv'nin derlenmiş doğrulayıcısını döndürür; tip tanımı
// çağrılabilirliği yansıtmıyor.
type CompiledValidator = ((event: unknown) => boolean) & { errors?: unknown }

/**
 * Regresyon koruması: locale enum'ları eskiden 16 validator dosyasında elle
 * kopyalanmıştı. Unutulan bir dosya yeni dilleri yalnız Zod katmanında 400'e
 * düşürüyordu — handler'lar `getSupportedLocale` ile zaten dilden bağımsız
 * çalıştığı için hata başka hiçbir yerde görünmüyordu.
 */
describe("paylaşılan locale şemaları", () => {
    it("desteklenen her dili kabul eder", () => {
        for (const locale of SUPPORTED_LOCALES) {
            expect(localeSchema.safeParse(locale).success).toBe(true)
        }
    })

    it("desteklenmeyen dili reddeder", () => {
        expect(localeSchema.safeParse("xx").success).toBe(false)
    })

    it("hedef dil şeması varsayılan dili dışlar", () => {
        expect(targetLocaleSchema.safeParse("tr").success).toBe(false)
        for (const locale of TARGET_LOCALES) {
            expect(targetLocaleSchema.safeParse(locale).success).toBe(true)
        }
    })

    it("dizi sınırları dil sayısıyla birlikte büyür", () => {
        // Sabit .max(10) 10'dan fazla dilde her tam-payload kaydı 400'e düşürüyordu.
        expect(TRANSLATIONS_ARRAY_MAX).toBe(SUPPORTED_LOCALES.length)
        expect(REMOVABLE_TRANSLATION_LOCALES_MAX).toBe(SUPPORTED_LOCALES.length - 1)
    })
})

describe("validator'lar yeni dilleri kabul eder", () => {
    it("public slug route'u her desteklenen locale query'sini geçirir", () => {
        const validate = transpileSchema(slugValidator) as unknown as CompiledValidator

        for (const locale of SUPPORTED_LOCALES) {
            const ok = validate({
                pathParameters: { slug: "bir-urun" },
                queryStringParameters: { locale },
            })
            expect(ok, `locale=${locale} reddedildi`).toBe(true)
        }
    })

    it("admin kategori güncellemesi her dil için çeviri taşıyabilir", () => {
        const validate = transpileSchema(updateCategoryValidator) as unknown as CompiledValidator

        const ok = validate({
            pathParameters: { id: "3fa85f64-5717-4562-b3fc-2c963f66afa6" },
            body: {
                translations: SUPPORTED_LOCALES.map((locale) => ({
                    locale,
                    name: `Kategori ${locale}`,
                })),
                removeTranslationLocales: [...TARGET_LOCALES],
            },
        })

        if (!ok) console.log(JSON.stringify(validate.errors, null, 2))
        expect(ok).toBe(true)
    })
})
