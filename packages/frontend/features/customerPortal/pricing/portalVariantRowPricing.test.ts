import { describe, expect, it } from "vitest"
import type { VariantTableData } from "@/features/public/products/components/ProductVariantTable"
import {
    buildCompactMaterialSummary,
    buildCompactMeasurementSummary,
    buildWhatsappPriceRequestUrl,
    decimalLikeToText,
    resolveBasePricing,
    resolveMinListPrice,
    resolvePortalPricing,
} from "./portalVariantRowPricing"

function buildVariant(overrides: Partial<VariantTableData> = {}): VariantTableData {
    return {
        id: "variant-1",
        name: "10.5.8.V1",
        versionCode: "V1",
        fullCode: "10.5.8.V1",
        measurements: [
            {
                id: "m1",
                value: 20,
                label: "20",
                measurementType: {
                    id: "mt-r",
                    name: "Elcik Çapı",
                    code: "R",
                    baseUnit: "mm",
                    displayOrder: 1,
                },
            },
        ],
        color: { id: "color-1", name: "Kırmızı" },
        materials: [{ id: "material-1", name: "Polipropilen", code: "PP" }],
        variantSuppliers: [],
        ...overrides,
    }
}

describe("decimalLikeToText", () => {
    it("Prisma Decimal serileştirmesini ({s,e,d}) sayı metnine çevirir", () => {
        // 12.5 → s:1 (pozitif), digits: [1,2,5], e:1 (12. basamak indeksi)
        expect(decimalLikeToText({ s: 1, e: 1, d: [1, 2, 5] })).toBe("12.5")
    })

    it("null/undefined için boş string döner", () => {
        expect(decimalLikeToText(null)).toBe("")
        expect(decimalLikeToText(undefined)).toBe("")
    })

    it("number ve string girdiyi olduğu gibi normalize eder", () => {
        expect(decimalLikeToText(42)).toBe("42.00")
        expect(decimalLikeToText("13.37")).toBe("13.37")
    })
})

describe("resolveMinListPrice", () => {
    it("birden çok tedarikçi arasından EN DÜŞÜK liste fiyatını seçer", () => {
        const variant = buildVariant({
            variantSuppliers: [
                { id: "s1", currency: "TRY", listPrice: 150, supplier: { id: "sup-1", name: "A" } },
                { id: "s2", currency: "TRY", listPrice: 120, supplier: { id: "sup-2", name: "B" } },
            ],
        })

        expect(resolveMinListPrice(variant)?.value).toBe(120)
    })

    it("tedarikçi yoksa null döner", () => {
        expect(resolveMinListPrice(buildVariant({ variantSuppliers: [] }))).toBeNull()
    })
})

describe("resolveBasePricing", () => {
    it("genel iskonto uygulanmışsa CUSTOMER_GENERAL_DISCOUNT kaynağını işaretler", () => {
        const variant = buildVariant({
            variantSuppliers: [{ id: "s1", currency: "TRY", listPrice: 100, supplier: { id: "sup-1", name: "A" } }],
        })

        const pricing = resolveBasePricing(variant, 20)

        expect(pricing.listUnitPrice).toBe(100)
        expect(pricing.customerUnitPrice).toBe(80)
        expect(pricing.priceSource).toBe("CUSTOMER_GENERAL_DISCOUNT")
    })

    it("iskonto yoksa LIST_PRICE kaynağında kalır", () => {
        const variant = buildVariant({
            variantSuppliers: [{ id: "s1", currency: "TRY", listPrice: 100, supplier: { id: "sup-1", name: "A" } }],
        })

        expect(resolveBasePricing(variant, 0).priceSource).toBe("LIST_PRICE")
    })
})

describe("resolvePortalPricing", () => {
    it("kampanya oranı genel iskontodan iyiyse kampanyayı uygular", () => {
        const variant = buildVariant({
            variantSuppliers: [{ id: "s1", currency: "TRY", listPrice: 100, supplier: { id: "sup-1", name: "A" } }],
        })

        const pricing = resolvePortalPricing({
            variant,
            quantity: 1,
            customerDiscountPercent: 10,
            campaignDiscountPercent: 30,
        })

        expect(pricing.priceSource).toBe("CAMPAIGN_DISCOUNT")
        expect(pricing.customerUnitPrice).toBe(70)
    })
})

describe("buildCompactMeasurementSummary / buildCompactMaterialSummary", () => {
    it("ölçüleri birim ile × ayracıyla, hammaddeleri kod ile birleştirir", () => {
        const variant = buildVariant()

        expect(buildCompactMeasurementSummary(variant)).toBe("20 mm")
        expect(buildCompactMaterialSummary(variant)).toBe("Polipropilen (PP)")
    })
})

describe("buildWhatsappPriceRequestUrl", () => {
    it("wa.me linkini üretir ve ürün/varyant bilgisini mesaja gömer", () => {
        const variant = buildVariant()
        const url = buildWhatsappPriceRequestUrl({
            variant,
            productName: "Menteşe Modeli",
            productCode: "MOD-1",
            categoryName: "Menteşeler",
            selectedMeasurements: variant.measurements,
            currentUrl: "https://ceyhunlarplastik.xyz/urun/menteseli",
        })

        expect(url.startsWith("https://wa.me/905530602946?text=")).toBe(true)
        const decoded = decodeURIComponent(url.split("?text=")[1] ?? "")
        expect(decoded).toContain("Menteşe Modeli")
        expect(decoded).toContain("10.5.8.V1")
    })
})
