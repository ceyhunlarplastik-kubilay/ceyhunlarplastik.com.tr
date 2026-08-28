import { describe, expect, it } from "vitest"

import {
    normalizeCartLogisticsProfiles,
    normalizeCartLogisticsVariantIds,
    type CartLogisticsSupplierRow,
} from "./cartLogistics"

const VARIANT_A = "11111111-1111-4111-8111-111111111111"
const VARIANT_B = "22222222-2222-4222-8222-222222222222"
const VARIANT_C = "33333333-3333-4333-8333-333333333333"

const completeSupplier = (overrides: Partial<CartLogisticsSupplierRow> = {}): CartLogisticsSupplierRow => ({
    unitsPerPackage: 10,
    packageLengthMm: 1_200,
    packageWidthMm: 800,
    packageHeightMm: 1_000,
    packageWeightKg: 25,
    ...overrides,
})

describe("normalizeCartLogisticsVariantIds", () => {
    it("kimlikleri tekilleştirip kararlı biçimde sıralar", () => {
        expect(normalizeCartLogisticsVariantIds([VARIANT_C, VARIANT_A, VARIANT_C, VARIANT_B]))
            .toEqual([VARIANT_A, VARIANT_B, VARIANT_C])
    })
})

describe("normalizeCartLogisticsProfiles", () => {
    it("mm³ değerini m³'e çevirir ve yalnız güvenli alanları döndürür", () => {
        const [profile] = normalizeCartLogisticsProfiles([VARIANT_A], [{
            id: VARIANT_A,
            variantSuppliers: [completeSupplier()],
        }])

        expect(profile).toEqual({
            productVariantId: VARIANT_A,
            status: "READY",
            logistics: {
                unitsPerPackage: 10,
                packageVolumeM3: 0.96,
                packageWeightKg: 25,
            },
        })
        expect(profile).not.toHaveProperty("supplierId")
        expect(profile.logistics).not.toHaveProperty("price")
        expect(profile.logistics).not.toHaveProperty("netCost")
    })

    it("Decimal-benzeri değerleri sayıya dönüştürür", () => {
        const decimal = (value: string) => ({ toString: () => value })
        const [profile] = normalizeCartLogisticsProfiles([VARIANT_A], [{
            id: VARIANT_A,
            variantSuppliers: [completeSupplier({
                packageLengthMm: decimal("400.50"),
                packageWidthMm: decimal("300.25"),
                packageHeightMm: decimal("200.75"),
                packageWeightKg: decimal("12.345"),
            })],
        }])

        expect(profile.status).toBe("READY")
        expect(profile.logistics?.packageVolumeM3).toBeCloseTo(
            (400.5 * 300.25 * 200.75) / 1_000_000_000,
        )
        expect(profile.logistics?.packageWeightKg).toBe(12.345)
    })

    it("bulunmayan varyant için tek bir NOT_FOUND profili üretir", () => {
        expect(normalizeCartLogisticsProfiles([VARIANT_A], [])).toEqual([{
            productVariantId: VARIANT_A,
            status: "NOT_FOUND",
            logistics: null,
        }])
    })

    it("aktif satır yokluğunu ve birden fazla aktif satırı ayırır", () => {
        expect(normalizeCartLogisticsProfiles([VARIANT_A], [{
            id: VARIANT_A,
            variantSuppliers: [],
        }])[0].status).toBe("NO_ACTIVE_SUPPLIER")

        expect(normalizeCartLogisticsProfiles([VARIANT_A], [{
            id: VARIANT_A,
            variantSuppliers: [completeSupplier(), completeSupplier()],
        }])[0].status).toBe("AMBIGUOUS_ACTIVE_SUPPLIER")
    })

    it.each([
        ["units null", { unitsPerPackage: null }],
        ["units zero", { unitsPerPackage: 0 }],
        ["units negative", { unitsPerPackage: -1 }],
        ["units fractional", { unitsPerPackage: 1.5 }],
        ["length null", { packageLengthMm: null }],
        ["length zero", { packageLengthMm: 0 }],
        ["width negative", { packageWidthMm: -1 }],
        ["height invalid", { packageHeightMm: "invalid" }],
    ])("zorunlu koli alanı geçersizse INCOMPLETE_PACKAGE_DATA döndürür: %s", (_name, override) => {
        const [profile] = normalizeCartLogisticsProfiles([VARIANT_A], [{
            id: VARIANT_A,
            variantSuppliers: [completeSupplier(override)],
        }])

        expect(profile).toEqual({
            productVariantId: VARIANT_A,
            status: "INCOMPLETE_PACKAGE_DATA",
            logistics: null,
        })
    })

    it.each([null, 0, -10, "invalid"])(
        "ağırlık %j olduğunda hacmi hazır tutup ağırlığı null yapar",
        (packageWeightKg) => {
            const [profile] = normalizeCartLogisticsProfiles([VARIANT_A], [{
                id: VARIANT_A,
                variantSuppliers: [completeSupplier({ packageWeightKg })],
            }])

            expect(profile.status).toBe("READY")
            expect(profile.logistics?.packageWeightKg).toBeNull()
        },
    )

    it("tekrarlı girdiyi tekilleştirir ve her normalleştirilmiş varyant için bir sonuç verir", () => {
        const profiles = normalizeCartLogisticsProfiles(
            [VARIANT_B, VARIANT_A, VARIANT_B, VARIANT_C],
            [{ id: VARIANT_B, variantSuppliers: [completeSupplier()] }],
        )

        expect(profiles.map((profile) => profile.productVariantId)).toEqual([
            VARIANT_A,
            VARIANT_B,
            VARIANT_C,
        ])
        expect(profiles).toHaveLength(3)
    })
})
