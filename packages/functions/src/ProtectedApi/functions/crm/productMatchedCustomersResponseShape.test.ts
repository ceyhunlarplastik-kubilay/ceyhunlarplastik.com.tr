import { describe, expect, it } from "vitest"
import { transpileSchema } from "@middy/validator/transpile"
import type { ValidateFunction } from "ajv"

import { productMatchedCustomersResponseValidator } from "@/functions/ProtectedApi/validators/crm"
import type { ProductMatchedCustomersResult } from "@/core/helpers/crm/getProductMatchedCustomers"

/**
 * Response validator ile helper'ın GERÇEK çıktısı arasındaki sapmayı yakalar.
 * TypeScript bunu göremez: Zod şeması bağımsız bir bildirimdir, helper'ın dönüş
 * tipiyle bağlı değildir — alan kaldırılırsa derleme yeşil kalır, uç çalışma
 * zamanında "Response object failed validation" ile 500 verir (yaşandı:
 * `createdVersions`, customers, productVariantSuppliers).
 *
 * DİKKAT: bu dosya `validators/` altında DURAMAZ — `validatorCompilation.test.ts`
 * orayı `import.meta.glob(..., { eager: true })` ile tarıyor.
 */

// Helper'ın sonucuyla AYNI tipte — alan listesi buradan sapamaz.
const result: ProductMatchedCustomersResult = {
    data: [{
        id: "031c4d0b-e7d1-4da9-a994-79990013368d",
        companyName: "Acme Plastik",
        fullName: null,
        email: "info@acme.test",
        phone: "+905550000000",
        status: "LEAD",
        createdAt: new Date("2026-08-27T00:00:00.000Z"),
        sectorName: "Otomotiv",
        productionGroupName: null,
        assignedSalesUserName: null,
        locationSummary: "Bursa / Nilüfer",
        address: {
            id: "fdbcc4cb-cd70-41c2-945c-2ec4d738a5cb",
            label: "Merkez",
            summary: "Organize Sanayi 3. Cadde No 12, Nilüfer, Bursa, Türkiye",
            latitude: 40.21,
            longitude: 28.95,
            isPrimary: true,
            isShipping: true,
        },
        matchedLabels: ["Otomotiv"],
    }],
    meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    counts: { all: 1, lead: 1, customer: 0 },
    reach: {
        sectors: [{ id: "e69dda9d-98e3-4709-81ad-8aa667b7b47e", name: "Otomotiv" }],
        productionGroups: [],
        usageAreas: [],
    },
}

describe("productMatchedCustomersResponseValidator", () => {
    it("listProductMatchedCustomers'ın gerçek çıktısını kabul eder", () => {
        // `apiResponseDTO` Date'leri ISO string'e çevirir; şema onu bekliyor.
        const payload = JSON.parse(JSON.stringify(result))

        const validate = transpileSchema(productMatchedCustomersResponseValidator) as unknown as ValidateFunction
        const valid = validate({ statusCode: 200, body: { statusCode: 200, payload } })

        expect(validate.errors ?? []).toEqual([])
        expect(valid).toBe(true)
    })
})
