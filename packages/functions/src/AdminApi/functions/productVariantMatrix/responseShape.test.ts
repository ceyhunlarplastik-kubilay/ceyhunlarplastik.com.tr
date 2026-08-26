import { describe, expect, it } from "vitest"
import { transpileSchema } from "@middy/validator/transpile"
import type { ValidateFunction } from "ajv"

import {
    saveVariantMatrixResponseValidator,
    bulkDeleteVariantMatrixResponseValidator,
} from "@/functions/AdminApi/validators/productVariantMatrix"
import { planVariantDeletion } from "@/core/helpers/productVariants/variantDeletionBlockers"
import type { ProductVariantMatrix } from "@/core/helpers/prisma/productVariantMatrix/repository"
import type { UpsertProductVariantRowsResult } from "@/core/helpers/productVariants/productVariantWriter"

/**
 * Response validator ile handler'ın GERÇEK çıktısı arasındaki sapmayı yakalar.
 *
 * Gerçek vaka (2026-08-21): `createdVersions` yazıcının sonucundan kaldırıldı ama
 * response şemasından kaldırılmadı. TypeScript bunu göremez — Zod şeması bağımsız
 * bir bildirimdir, handler'ın dönüş tipiyle bağlı değildir. Sonuç: derleme ve tüm
 * testler yeşilken kubi'de her kayıt "Response object failed validation" ile 500
 * verdi. Aynı sınıftan hata daha önce customers ve productVariantSuppliers
 * validator'larında da çıkmıştı.
 *
 * Koruma iki yönlü çalışır:
 *  - Yazıcı bir alan KALDIRIRSA fixture derlenmez (tipli), geliştirici alanı siler,
 *    bu test "must have required property" ile şemanın da güncellenmesi gerektiğini
 *    söyler.
 *  - Yazıcı bir alan EKLERSE fixture derlenmez ve alan şemaya taşınır.
 *
 * DİKKAT: bu dosya `validators/` altında DURAMAZ — `validatorCompilation.test.ts`
 * oradaki her modülü `import.meta.glob(..., { eager: true })` ile yüklüyor ve
 * buradaki suite o testin içine de kaydoluyordu.
 */

// Yazıcının sonucuyla AYNI tipte — alan listesi buradan sapamaz.
const writerResult: UpsertProductVariantRowsResult = {
    productId: "11111111-1111-1111-1111-111111111111",
    affectedVariantIds: ["22222222-2222-2222-2222-222222222222"],
    createdSizes: 1,
    createdSupplierCodes: 1,
    createdVariants: 1,
    createdVariantSuppliers: 1,
    rewrittenCodes: 3,
}

// Matris payload'ı da AYNI korumada: repository bir alan kaldırırsa/eklerse burada
// derlenmez, şema da güncellenmek zorunda kalır.
const matrix: ProductVariantMatrix = {
    product: {
        id: "11111111-1111-1111-1111-111111111111",
        code: "10.5",
        name: "Kol",
    },
    requirements: [{
        id: "33333333-3333-3333-3333-333333333333",
        measurementTypeId: "44444444-4444-4444-4444-444444444444",
        measurementCode: "R",
        label: "Kol Çapı",
        unit: "mm",
        isRequired: true,
        sortPriority: 0,
        displayOrder: 0,
    }],
    sizes: [{
        id: "55555555-5555-5555-5555-555555555555",
        code: 1,
        values: [{ requirementId: "33333333-3333-3333-3333-333333333333", value: 10 }],
    }],
    versions: [{ id: "66666666-6666-6666-6666-666666666666", code: "V1", colorId: null, materialIds: [] }],
    supplierCodes: [{
        id: "77777777-7777-7777-7777-777777777777",
        supplierId: "88888888-8888-8888-8888-888888888888",
        supplierName: "X",
        code: "A",
    }],
    versionDictionary: [{ id: "66666666-6666-6666-6666-666666666666", code: 1, colorId: null, materialIds: [] }],
    rows: [{
        variantId: "22222222-2222-2222-2222-222222222222",
        fullCode: "10.5.1.V1",
        name: "Kol",
        sizeId: "55555555-5555-5555-5555-555555555555",
        versionId: "66666666-6666-6666-6666-666666666666",
        suppliers: [{
            id: "99999999-9999-9999-9999-999999999999",
            supplierId: "88888888-8888-8888-8888-888888888888",
            supplierCode: "A",
            fullCode: "10.5.1.V1.A",
            isActive: true,
        }],
    }],
}

describe("saveVariantMatrixResponseValidator", () => {
    it("yazıcının ve matris repository'sinin gerçek çıktısını kabul eder", () => {
        // Runtime'ın kendi derleyicisi — middy response tarafında saf varsayılanları
        // kullanıyor, burada da öyle çağrılıyor.
        //
        // @middy/validator'ın .d.ts'i dönüş tipini `Ajv` diye bildiriyor ama
        // çalışma zamanında derlenmiş doğrulama fonksiyonu dönüyor (middy'nin
        // kendi middleware'i de onu çağırarak kullanıyor). Cast bu tip hatası için.
        const validate = transpileSchema(saveVariantMatrixResponseValidator) as unknown as ValidateFunction

        const valid = validate({
            statusCode: 200,
            body: { statusCode: 200, payload: { result: writerResult, matrix } },
        })

        expect(validate.errors ?? []).toEqual([])
        expect(valid).toBe(true)
    })
})

describe("bulkDeleteVariantMatrixResponseValidator", () => {
    it("planlayıcının gerçek çıktısını kabul eder", () => {
        // `blocked` doğrudan planlayıcıdan geliyor — şema onunla senkron kalmalı.
        const plan = planVariantDeletion([
            {
                id: "11111111-1111-1111-1111-111111111111",
                fullCode: "10.5.1.V1",
                counts: {
                    orderItems: 0, requestItems: 0, customerSpecialPrices: 0,
                    campaignItems: 0, assignedToCustomers: 0,
                },
            },
            {
                id: "22222222-2222-2222-2222-222222222222",
                fullCode: "10.5.2.V1",
                counts: {
                    orderItems: 2, requestItems: 0, customerSpecialPrices: 0,
                    campaignItems: 0, assignedToCustomers: 0,
                },
            },
        ])

        const validate = transpileSchema(bulkDeleteVariantMatrixResponseValidator) as unknown as ValidateFunction
        const valid = validate({
            statusCode: 200,
            body: {
                statusCode: 200,
                payload: {
                    deletedIds: plan.deletableIds,
                    blocked: plan.blocked,
                    removedSizes: 1,
                    rewrittenCodes: 3,
                },
            },
        })

        expect(validate.errors ?? []).toEqual([])
        expect(valid).toBe(true)
    })
})
