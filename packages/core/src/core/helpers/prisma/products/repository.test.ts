import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({
    productTranslation: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
    },
    product: {
        findUniqueOrThrow: vi.fn(),
    },
}))

vi.mock("@/core/db/prisma", () => ({
    prisma: prismaMock,
}))

import { productRepository } from "./repository"

describe("productRepository getProductBySlug", () => {
    beforeEach(() => {
        prismaMock.productTranslation.findUnique.mockReset()
        prismaMock.productTranslation.findFirst.mockReset()
        prismaMock.product.findUniqueOrThrow.mockReset()
        prismaMock.productTranslation.findFirst.mockResolvedValue(null)
    })

    it("resolves the requested locale translation slug first", async () => {
        const product = { id: "product-1", code: "10.11" }
        prismaMock.productTranslation.findUnique.mockResolvedValueOnce({ product })

        await expect(productRepository().getProductBySlug("english-product", "en"))
            .resolves.toBe(product)

        expect(prismaMock.productTranslation.findUnique).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                locale_slug: {
                    locale: "en",
                    slug: "english-product",
                },
            },
        }))
        expect(prismaMock.product.findUniqueOrThrow).not.toHaveBeenCalled()
    })

    it("falls back to Turkish translation slug for target locale routes", async () => {
        const product = { id: "product-1", code: "10.11" }
        prismaMock.productTranslation.findUnique
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ product })

        await expect(productRepository().getProductBySlug("turkce-urun", "en"))
            .resolves.toBe(product)

        expect(prismaMock.productTranslation.findUnique).toHaveBeenNthCalledWith(2, expect.objectContaining({
            where: {
                locale_slug: {
                    locale: "tr",
                    slug: "turkce-urun",
                },
            },
        }))
        expect(prismaMock.product.findUniqueOrThrow).not.toHaveBeenCalled()
    })

    it("falls back to legacy product slug when no translation slug matches", async () => {
        const product = { id: "product-1", code: "10.11" }
        prismaMock.productTranslation.findUnique
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null)
        prismaMock.product.findUniqueOrThrow.mockResolvedValueOnce(product)

        await expect(productRepository().getProductBySlug("legacy-slug", "en"))
            .resolves.toBe(product)

        expect(prismaMock.product.findUniqueOrThrow).toHaveBeenCalledWith(expect.objectContaining({
            where: { slug: "legacy-slug" },
        }))
    })

    it("resolves a slug that belongs to another locale while the default locale is requested", async () => {
        // Regresyon: dil değiştirici ürün sayfasında slug'ı çevirmiyor, bu yüzden
        // EN sayfasından TR'ye geçmek /urun/<en-slug> üretiyor. Çözümleme eskiden
        // asimetrikti — TR isteği hiçbir çapraz-dil denemesi yapmadan legacy
        // kolona bakıp 404 veriyordu.
        const product = { id: "product-1", code: "10.11" }
        prismaMock.productTranslation.findUnique.mockResolvedValueOnce(null)
        prismaMock.productTranslation.findFirst.mockResolvedValueOnce({ product })

        await expect(productRepository().getProductBySlug("english-product", "tr"))
            .resolves.toBe(product)

        // Varsayılan dil istendiğinde ikinci bir locale_slug araması yapılmaz.
        expect(prismaMock.productTranslation.findUnique).toHaveBeenCalledTimes(1)
        expect(prismaMock.productTranslation.findFirst).toHaveBeenCalledWith(expect.objectContaining({
            where: { slug: "english-product" },
        }))
        expect(prismaMock.product.findUniqueOrThrow).not.toHaveBeenCalled()
    })

    it("still throws for a slug that exists in no locale", async () => {
        prismaMock.productTranslation.findUnique.mockResolvedValue(null)
        prismaMock.product.findUniqueOrThrow.mockRejectedValueOnce(new Error("NotFoundError"))

        await expect(productRepository().getProductBySlug("bilinmeyen-slug", "tr"))
            .rejects.toThrow()
    })
})
