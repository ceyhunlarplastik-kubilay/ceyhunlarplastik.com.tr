import { describe, expect, it, vi } from "vitest"

import type { CartLogisticsVariantRow } from "@/core/helpers/logistics/cartLogistics"
import { getPortalCartLogisticsHandler } from "./getPortalCartLogisticsHandler"
import type { IPortalCartLogisticsEvent } from "@/functions/ProtectedApi/types/products"

const VARIANT_A = "11111111-1111-4111-8111-111111111111"
const VARIANT_B = "22222222-2222-4222-8222-222222222222"

function portalEvent(variantIds: string[], customerId: string | null = "customer-1") {
    return {
        body: { variantIds },
        user: customerId ? { customerId } : {},
    } as unknown as IPortalCartLogisticsEvent
}

describe("getPortalCartLogisticsHandler", () => {
    it("kimlikleri tekilleştirip sıralar ve her kimlik için güvenli bir profil döndürür", async () => {
        const rows: CartLogisticsVariantRow[] = [{
            id: VARIANT_B,
            variantSuppliers: [{
                unitsPerPackage: 20,
                packageLengthMm: 400,
                packageWidthMm: 300,
                packageHeightMm: 250,
                packageWeightKg: 12.5,
            }],
        }]
        const listVariantLogisticsRows = vi.fn().mockResolvedValue(rows)

        const response = await getPortalCartLogisticsHandler({
            cartLogisticsRepository: { listVariantLogisticsRows },
        })(portalEvent([VARIANT_B, VARIANT_A, VARIANT_B]))

        expect(listVariantLogisticsRows).toHaveBeenCalledOnce()
        expect(listVariantLogisticsRows).toHaveBeenCalledWith([VARIANT_A, VARIANT_B])
        expect(response.body).toEqual({
            statusCode: 200,
            payload: {
                profiles: [
                    { productVariantId: VARIANT_A, status: "NOT_FOUND", logistics: null },
                    {
                        productVariantId: VARIANT_B,
                        status: "READY",
                        logistics: {
                            unitsPerPackage: 20,
                            packageVolumeM3: 0.03,
                            packageWeightKg: 12.5,
                        },
                    },
                ],
            },
        })

        const serialized = JSON.stringify(response.body)
        expect(serialized).not.toContain("supplierId")
        expect(serialized).not.toContain("price")
        expect(serialized).not.toContain("netCost")
        expect(serialized).not.toContain("profitRate")
    })

    it("müşteri portalı bağlamı yoksa sorgu yapmadan reddeder", async () => {
        const listVariantLogisticsRows = vi.fn()

        await expect(getPortalCartLogisticsHandler({
            cartLogisticsRepository: { listVariantLogisticsRows },
        })(portalEvent([VARIANT_A], null))).rejects.toMatchObject({ statusCode: 403 })
        expect(listVariantLogisticsRows).not.toHaveBeenCalled()
    })
})
