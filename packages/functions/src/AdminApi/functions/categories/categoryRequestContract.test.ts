import { describe, expect, it } from "vitest"
import { transpileSchema } from "@middy/validator/transpile"
import type { ValidateFunction } from "ajv"

import {
    createCategoryAssetUploadValidator,
    createCategoryValidator,
    updateCategoryValidator,
} from "@/functions/AdminApi/validators/categories"

/**
 * Kategori görseli yalnız presign ile eklenir: istemci anahtar (`assetKey`) gönderemez,
 * presign de yalnız var olan kategori ve izinli içerik tipiyle çalışır. Eskiden
 * `POST /categories` istemcinin anahtarını doğrulamadan ACTIVE satır olarak yazıyordu.
 *
 * Bu dosya `validators/` altında DURAMAZ (`validatorCompilation.test.ts` orayı eager yükler).
 */
const CATEGORY_ID = "3f2b8c1e-5a4d-4e6f-9a1b-2c3d4e5f6a7b"

// Middy'nin istek tarafında kullandığı ajv ayarları (bkz. core/middy.ts).
const compile = (schema: object) =>
    transpileSchema(schema, {
        allErrors: true,
        strict: true,
        coerceTypes: "array",
        useDefaults: "empty",
    }) as unknown as ValidateFunction

describe("kategori istek sözleşmesi — görsel yalnız presign ile", () => {
    const assetFields = {
        assetType: "IMAGE",
        assetRole: "PRIMARY",
        assetKey: "products/baska-urun/primary/x.png",
        mimeType: "image/png",
    }

    it("POST /categories görselsiz kabul edilir, görsel alanıyla reddedilir", () => {
        const validate = compile(createCategoryValidator)

        expect(validate({ body: { code: 10, name: "Bakalit Tutamak" } })).toBe(true)
        expect(validate({ body: { code: 10, name: "Bakalit Tutamak", ...assetFields } })).toBe(false)
        expect(validate({ body: { code: 10, name: "Bakalit Tutamak", assetKey: "x" } })).toBe(false)
    })

    it("PUT /categories/{id} görsel alanıyla reddedilir", () => {
        const validate = compile(updateCategoryValidator)

        expect(validate({ pathParameters: { id: CATEGORY_ID }, body: { name: "Bakalit Tutamaklar" } })).toBe(true)
        expect(validate({ pathParameters: { id: CATEGORY_ID }, body: { name: "Bakalit Tutamaklar", ...assetFields } })).toBe(false)
    })

    describe("POST /categories/assets/presign", () => {
        const validate = compile(createCategoryAssetUploadValidator)
        const body = {
            categoryId: CATEGORY_ID,
            assetRole: "PRIMARY",
            assetType: "IMAGE",
            fileName: "kapak.png",
            contentType: "image/png",
        }

        it("var olan kategori + izinli tip kabul edilir", () => {
            expect(validate({ body })).toBe(true)
        })

        it.each([
            ["categoryId yok", { categoryId: undefined }],
            ["assetType yok", { assetType: undefined }],
            ["izin listesinde olmayan tip", { contentType: "text/html" }],
            ["svg", { contentType: "image/svg+xml" }],
            ["istemcinin slug'ı (artık beyan edilmiyor)", { categorySlug: "baska" }],
        ])("%s → reddedilir", (_label, override) => {
            const candidate: Record<string, unknown> = { ...body, ...override }
            for (const key of Object.keys(candidate)) if (candidate[key] === undefined) delete candidate[key]

            expect(validate({ body: candidate })).toBe(false)
        })
    })
})
