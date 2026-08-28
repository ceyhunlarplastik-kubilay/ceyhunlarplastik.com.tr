import { describe, expect, it } from "vitest"

import {
    PORTAL_CART_CARRIERS,
    normalizePortalCartVariantIds,
    resolvePortalCarrierLoad,
    selectPortalCartVariantIds,
    summarizePortalCartLoad,
} from "./cartLoad"
import type { PortalCartLogisticsProfile } from "./types"

const A = "11111111-1111-4111-8111-111111111111"
const B = "22222222-2222-4222-8222-222222222222"
const C = "33333333-3333-4333-8333-333333333333"

function readyProfile(
    productVariantId: string,
    logistics: Partial<NonNullable<PortalCartLogisticsProfile["logistics"]>> = {},
): PortalCartLogisticsProfile {
    return {
        productVariantId,
        status: "READY",
        logistics: {
            unitsPerPackage: 10,
            packageVolumeM3: 1,
            packageWeightKg: 25,
            ...logistics,
        },
    }
}

describe("portal sepet lojistik kimlikleri", () => {
    it("sıralı ve tekil query kümesi üretir", () => {
        expect(normalizePortalCartVariantIds([C, A, C, B])).toEqual([A, B, C])
    })

    it("miktar değişince query kimlik kümesi değişmez", () => {
        const before = selectPortalCartVariantIds([{ variantId: B, quantity: 1 }, { variantId: A, quantity: 2 }])
        const after = selectPortalCartVariantIds([{ variantId: B, quantity: 999 }, { variantId: A, quantity: 5 }])
        expect(after).toEqual(before)
    })
})

describe("summarizePortalCartLoad", () => {
    it("tam koliye yukarı yuvarlar ve karışık sepeti toplar", () => {
        const summary = summarizePortalCartLoad(
            [{ variantId: A, quantity: 11 }, { variantId: B, quantity: 8 }],
            [
                readyProfile(A, { unitsPerPackage: 10, packageVolumeM3: 0.5, packageWeightKg: 20 }),
                readyProfile(B, { unitsPerPackage: 4, packageVolumeM3: 0.25, packageWeightKg: 5 }),
            ],
        )

        expect(summary.totalPackages).toBe(4)
        expect(summary.totalVolumeM3).toBe(1.5)
        expect(summary.knownWeightKg).toBe(50)
        expect(summary.isComplete).toBe(true)
        expect(summary.automaticLoad?.carrier.id).toBe("EURO_PALLET")
    })

    it("tam kapasitede tek araç ve yüzde 100 döndürür", () => {
        const summary = summarizePortalCartLoad(
            [{ variantId: A, quantity: 1 }],
            [readyProfile(A, { unitsPerPackage: 1, packageVolumeM3: 33 })],
        )

        const twenty = summary.carrierLoads[1]
        expect(twenty.requiredVehicleCount).toBe(1)
        expect(twenty.lastVehicleFillPercent).toBe(100)
        expect(summary.automaticLoad?.carrier.id).toBe("CONTAINER_20_STD")
    })

    it("yüzde 1 altındaki doluluğu hesapta korur", () => {
        const load = resolvePortalCarrierLoad(0.01, PORTAL_CART_CARRIERS[1])
        expect(load.lastVehicleFillPercent).toBeCloseTo(0.030303, 5)
    })

    it("kapasite aşımında araç adedi ve son araç doluluğunu hesaplar", () => {
        const load = resolvePortalCarrierLoad(100, PORTAL_CART_CARRIERS[4])
        expect(load.requiredVehicleCount).toBe(2)
        expect(load.lastVehicleFillPercent).toBeCloseTo((17 / 83) * 100)
        expect(load.overflowVolumeM3).toBe(17)
        expect(load.fitsInSingleVehicle).toBe(false)
    })

    it("83 m³ üzerinde tırı otomatik seçip çoklu araç sonucunu korur", () => {
        const summary = summarizePortalCartLoad(
            [{ variantId: A, quantity: 1 }],
            [readyProfile(A, { unitsPerPackage: 1, packageVolumeM3: 170 })],
        )

        expect(summary.automaticLoad?.carrier.id).toBe("CURTAIN_TRUCK_13_6")
        expect(summary.automaticLoad?.requiredVehicleCount).toBe(3)
        expect(summary.automaticLoad?.lastVehicleFillPercent).toBeCloseTo((4 / 83) * 100)
    })

    it("eksik profilde bilinen hacmi alt sınır tutar ve otomatik sığar iddiası yapmaz", () => {
        const summary = summarizePortalCartLoad(
            [{ variantId: A, quantity: 5 }, { variantId: B, quantity: 3 }],
            [
                readyProfile(A, { unitsPerPackage: 5, packageVolumeM3: 0.8 }),
                { productVariantId: B, status: "INCOMPLETE_PACKAGE_DATA", logistics: null },
            ],
        )

        expect(summary.totalVolumeM3).toBe(0.8)
        expect(summary.issues).toEqual([{ productVariantId: B, status: "INCOMPLETE_PACKAGE_DATA" }])
        expect(summary.isComplete).toBe(false)
        expect(summary.automaticLoad).toBeNull()
    })

    it("kısmi ağırlığı en az değer olarak taşır", () => {
        const summary = summarizePortalCartLoad(
            [{ variantId: A, quantity: 10 }, { variantId: B, quantity: 10 }],
            [readyProfile(A), readyProfile(B, { packageWeightKg: null })],
        )

        expect(summary.knownWeightKg).toBe(25)
        expect(summary.hasKnownWeight).toBe(true)
        expect(summary.isWeightComplete).toBe(false)
        expect(summary.missingWeightItemCount).toBe(1)
    })

    it("API'de bulunmayan profili eksik sayar", () => {
        const summary = summarizePortalCartLoad(
            [{ variantId: A, quantity: 1 }],
            [],
        )

        expect(summary.issues[0].status).toBe("PROFILE_MISSING")
        expect(summary.hasKnownVolume).toBe(false)
    })
})
