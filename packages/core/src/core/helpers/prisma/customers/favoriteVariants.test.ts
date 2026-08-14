import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Favori varyantların KAYNAK İZOLASYONU sözleşmesi.
 *
 * Kritik kural: temsilcinin listeyi kaydetmesi (`replaceAssignedProducts`)
 * müşterinin kalple eklediği favorileri SİLMEMELİ. Kapsam daraltması tek bir
 * `where` alanına bağlı olduğu için sessizce kaybolmaya çok müsait; bu testler
 * o daraltmayı sabitler.
 */

const prismaMock = vi.hoisted(() => {
    const customerAssignedProduct = {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        upsert: vi.fn(),
    }

    return {
        customerAssignedProduct,
        // replaceAssignedProducts interaktif transaction kullanıyor; callback'e
        // aynı mock'u tx olarak veriyoruz.
        $transaction: vi.fn(async (callback: (tx: unknown) => unknown) =>
            callback({ customerAssignedProduct }),
        ),
    }
})

vi.mock("@/core/db/prisma", () => ({
    prisma: prismaMock,
}))

import { customerRepository } from "./repository"

describe("favori varyant kaynak izolasyonu", () => {
    beforeEach(() => {
        prismaMock.customerAssignedProduct.deleteMany.mockReset()
        prismaMock.customerAssignedProduct.createMany.mockReset()
        prismaMock.customerAssignedProduct.findMany.mockReset()
        prismaMock.customerAssignedProduct.findFirst.mockReset()
        prismaMock.customerAssignedProduct.upsert.mockReset()
        prismaMock.customerAssignedProduct.findMany.mockResolvedValue([])
        prismaMock.customerAssignedProduct.findFirst.mockResolvedValue(null)
    })

    it("temsilci ataması yalnız STAFF satırlarını siler", async () => {
        await customerRepository().replaceAssignedProducts("cust-1", ["var-1"], "user-1")

        expect(prismaMock.customerAssignedProduct.deleteMany).toHaveBeenCalledWith({
            where: { customerId: "cust-1", source: "STAFF" },
        })
    })

    it("temsilci ataması STAFF olarak yazılır", async () => {
        await customerRepository().replaceAssignedProducts("cust-1", ["var-1", "var-2"], "user-1")

        expect(prismaMock.customerAssignedProduct.createMany).toHaveBeenCalledWith({
            data: [
                { customerId: "cust-1", productVariantId: "var-1", displayOrder: 0, source: "STAFF", createdByUserId: "user-1" },
                { customerId: "cust-1", productVariantId: "var-2", displayOrder: 1, source: "STAFF", createdByUserId: "user-1" },
            ],
        })
    })

    it("boş liste gelse bile silme kapsamı STAFF'ta kalır", async () => {
        await customerRepository().replaceAssignedProducts("cust-1", [], "user-1")

        expect(prismaMock.customerAssignedProduct.deleteMany).toHaveBeenCalledWith({
            where: { customerId: "cust-1", source: "STAFF" },
        })
        expect(prismaMock.customerAssignedProduct.createMany).not.toHaveBeenCalled()
    })

    it("müşteri favorisi CUSTOMER kaynağıyla ve sıradaki displayOrder ile eklenir", async () => {
        prismaMock.customerAssignedProduct.findFirst.mockResolvedValueOnce({ displayOrder: 4 })

        await customerRepository().addCustomerFavoriteVariant("cust-1", "var-9", "portal-user")

        expect(prismaMock.customerAssignedProduct.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    customerId_productVariantId_source: {
                        customerId: "cust-1",
                        productVariantId: "var-9",
                        source: "CUSTOMER",
                    },
                },
                create: {
                    customerId: "cust-1",
                    productVariantId: "var-9",
                    source: "CUSTOMER",
                    displayOrder: 5,
                    createdByUserId: "portal-user",
                },
                // Zaten favorideyse sahiplik ve sıra korunmalı.
                update: {},
            }),
        )
    })

    it("ilk favoride displayOrder sıfırdan başlar", async () => {
        await customerRepository().addCustomerFavoriteVariant("cust-1", "var-9", "portal-user")

        expect(prismaMock.customerAssignedProduct.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                create: expect.objectContaining({ displayOrder: 0 }),
            }),
        )
    })

    it("favori çıkarma temsilci atamasına dokunmaz", async () => {
        await customerRepository().removeCustomerFavoriteVariant("cust-1", "var-9")

        expect(prismaMock.customerAssignedProduct.deleteMany).toHaveBeenCalledWith({
            where: { customerId: "cust-1", productVariantId: "var-9", source: "CUSTOMER" },
        })
    })
})
