import { describe, expect, it } from "vitest"
import { transpileSchema } from "@middy/validator/transpile"
import type { ValidateFunction } from "ajv"

import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    listProductVariantSuppliersResponseValidator,
    productVariantSupplierResponseValidator,
} from "@/functions/AdminApi/validators/productVariantSuppliers"

const now = new Date("2026-09-30T12:00:00.000Z")
const id = (n: number) => `00000000-0000-4000-8000-00000000000${n}`

/**
 * Repository'nin döndürdüğü HAM satırın biçimi: varyant düzleştirilmez, yani `colorId`,
 * `versionCode`, `sizeCode` YOKTUR (renk `version` üzerinde). Şema bunları zorunlu tutarsa uç 500 verir.
 */
const row = {
    id: id(1),
    variantId: id(2),
    supplierId: id(3),
    isActive: true,
    price: { s: 1, e: 1, d: [12, 5000000] },
    operationalCostRate: null,
    netCost: null,
    profitRate: null,
    listPrice: null,
    paymentTermDays: null,
    supplierVariantCode: null,
    supplierNote: null,
    minOrderQty: null,
    stockQty: null,
    pricingUpdatedAt: null,
    availabilityUpdatedAt: null,
    currency: "TRY",
    createdAt: now,
    updatedAt: now,
    variant: {
        id: id(2),
        name: "Kare Tapa 30x30",
        productId: id(4),
        productSizeId: id(5),
        variantVersionId: id(6),
        fullCode: "10.5.8.V1",
        size: { id: id(5), code: 8, values: [] },
        version: { id: id(6), code: 1, colorId: null, color: null, materials: [] },
        product: {
            id: id(4),
            code: "10.5",
            name: "Kare Tapa",
            slug: "kare-tapa",
            categoryId: id(7),
            category: { id: id(7), name: "Tapalar", slug: "tapalar", code: 10 },
        },
        createdAt: now,
        updatedAt: now,
    },
    supplier: {
        id: id(3),
        name: "Ceyhunlar Üretim",
        contactName: null,
        phone: null,
        address: null,
        taxNumber: null,
        defaultPaymentTermDays: null,
        isActive: true,
        isInHouseProduction: true,
        createdAt: now,
        updatedAt: now,
    },
}

function expectValid(schema: object, payload: Record<string, unknown>) {
    const validate = transpileSchema(schema) as unknown as ValidateFunction
    const valid = validate(JSON.parse(JSON.stringify(apiResponseDTO({ statusCode: 200, payload }))))
    expect(validate.errors ?? []).toEqual([])
    expect(valid).toBe(true)
}

describe("tedarikçi varyant satırı — response validator ↔ ham repository satırı", () => {
    it("düzleştirilmemiş varyant (colorId yok) liste ve tekil yanıtta geçerlidir", () => {
        expectValid(listProductVariantSuppliersResponseValidator, {
            data: [row],
            meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        })
        expectValid(productVariantSupplierResponseValidator, { productVariantSupplier: row })
    })
})
