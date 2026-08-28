import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({
    productVariant: { findMany: vi.fn() },
}))

vi.mock("@/core/db/prisma", () => ({ prisma: prismaMock }))

import { cartLogisticsRepository } from "./repository"

const VARIANT_A = "11111111-1111-4111-8111-111111111111"
const VARIANT_B = "22222222-2222-4222-8222-222222222222"

describe("cartLogisticsRepository", () => {
    beforeEach(() => {
        prismaMock.productVariant.findMany.mockReset()
        prismaMock.productVariant.findMany.mockResolvedValue([])
    })

    it("tek sorguda yalnız aktif satırların lojistik alanlarını seçer", async () => {
        await cartLogisticsRepository().listVariantLogisticsRows([VARIANT_B, VARIANT_A, VARIANT_B])

        expect(prismaMock.productVariant.findMany).toHaveBeenCalledTimes(1)
        expect(prismaMock.productVariant.findMany).toHaveBeenCalledWith({
            where: { id: { in: [VARIANT_A, VARIANT_B] } },
            select: {
                id: true,
                variantSuppliers: {
                    where: { isActive: true },
                    take: 2,
                    select: {
                        unitsPerPackage: true,
                        packageLengthMm: true,
                        packageWidthMm: true,
                        packageHeightMm: true,
                        packageWeightKg: true,
                    },
                },
            },
        })

        const select = prismaMock.productVariant.findMany.mock.calls[0][0].select.variantSuppliers.select
        expect(select).not.toHaveProperty("supplierId")
        expect(select).not.toHaveProperty("price")
        expect(select).not.toHaveProperty("netCost")
        expect(select).not.toHaveProperty("profitRate")
        expect(select).not.toHaveProperty("listPrice")
        expect(select).not.toHaveProperty("supplierNote")
    })

    it("boş kimlik kümesinde veritabanına gitmez", async () => {
        await expect(cartLogisticsRepository().listVariantLogisticsRows([])).resolves.toEqual([])
        expect(prismaMock.productVariant.findMany).not.toHaveBeenCalled()
    })
})
