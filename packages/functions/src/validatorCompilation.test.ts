import { describe, expect, it } from "vitest"
import { transpileSchema } from "@middy/validator/transpile"

/**
 * `lambdaHandler` validator'ları MODÜL YÜKLENİRKEN ajv'ye derletir
 * (`transpileSchema`, actions.ts'te top-level çağrılır). Bu yüzden derlenmeyen
 * TEK bir validator, onu taşıyan actions.ts dosyasındaki TÜM endpoint'leri
 * import anında düşürür — testler yeşilken prod'da 500 olarak görünür.
 *
 * Gerçek vaka: `productModel3dConfigSchema` içindeki `factor: …default(1)` bir
 * discriminatedUnion (`oneOf`) altında kaldığı için ajv `strict: true` altında
 * "strict mode: default is ignored for: data80.factor" ile derlemeyi reddetti;
 * PublicApi ürün uçlarının tamamı çalışmaz oldu.
 *
 * Bu test her validator'ı middy'nin kullandığı ajv ayarlarıyla derler; kapsam
 * glob ile genişlediği için yeni validator dosyaları da otomatik korunur.
 */

/**
 * `import.meta.glob` bir Vite/vitest API'si ve DERLEME ZAMANI dönüşümüdür: çağrı
 * birebir bu biçimde durmalı, değişkene alınırsa Vite dönüştüremez. Backend
 * tsconfig'i `vite/client` tiplerini kapsamadığı için tipi burada bildiriyoruz.
 *
 * Glob kullanılmasının sebebi kapsamın elle güncellenmemesi: yeni eklenen her
 * validator dosyası otomatik olarak bu korumaya girer.
 */
declare global {
    interface ImportMeta {
        glob: (
            pattern: string,
            options: { eager: boolean },
        ) => Record<string, Record<string, unknown>>
    }
}

const modules = import.meta.glob("./**/validators/*.ts", { eager: true })

// Request tarafı middy varsayılanlarını lambdaHandler'da açıkça geçiyor;
// response tarafı saf varsayılanları kullanıyor. İkisi de sınanmalı.
const REQUEST_AJV_OPTIONS = {
    allErrors: true,
    strict: true,
    coerceTypes: "array",
    useDefaults: "empty",
} as const

function jsonSchemaExports(mod: Record<string, unknown>): Array<[string, object]> {
    const entries: Array<[string, object]> = []

    for (const [name, value] of Object.entries(mod)) {
        if (!value || typeof value !== "object") continue
        const record = value as Record<string, unknown>
        // Ham Zod şemaları da export ediliyor; ajv'ye yalnız validatorWrapper /
        // z.toJSONSchema çıktısı veriliyor.
        if (typeof record.parse === "function") continue
        if (!Object.prototype.hasOwnProperty.call(record, "$schema")) continue
        entries.push([name, value])
    }

    return entries
}

const cases: Array<{ path: string; name: string; schema: object }> = Object.entries(modules)
    .filter(([path]) => !path.endsWith(".test.ts"))
    .flatMap(([path, mod]) =>
        jsonSchemaExports(mod).map(([name, schema]) => ({ path, name, schema })),
    )

describe("Lambda validator şemaları ajv ile derlenebilir", () => {
    it("taranacak validator bulur", () => {
        // Glob sessizce boşalırsa test hiçbir şeyi korumaz.
        expect(cases.length).toBeGreaterThan(100)
    })

    it.each(cases)("$path → $name", ({ schema }) => {
        expect(() => transpileSchema(schema, REQUEST_AJV_OPTIONS)).not.toThrow()
        expect(() => transpileSchema(schema)).not.toThrow()
    })
})
