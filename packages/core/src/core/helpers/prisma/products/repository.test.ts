import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({
    productTranslation: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
    },
    product: {
        findUniqueOrThrow: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
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

/**
 * Regresyon: `isNew`/`hasNewVariant`/`onCampaign` filtreleri (2026-09-14, "yeni
 * ürün/varyant/kampanyalı" filtre özelliği). Varsayılan sıralama "code" olduğu
 * için `listProducts` önce `finalWhere` ile yalnız `{id, code}` çeker (natural
 * sort için) — testler o ilk `findMany` çağrısının `where`'ini doğrular.
 */
describe("productRepository listProducts lifecycle/campaign filters", () => {
    beforeEach(() => {
        prismaMock.product.findMany.mockReset()
        prismaMock.product.count.mockReset()
        prismaMock.product.findMany.mockResolvedValue([])
    })

    it("isNew: Product.createdAt eşiğini AND dizisine ekler", async () => {
        await productRepository().listProducts({ page: 1, limit: 20, isNew: true })

        const where = prismaMock.product.findMany.mock.calls[0]?.[0]?.where
        expect(where.AND).toContainEqual({ createdAt: { gte: expect.any(Date) } })
    })

    it("hasNewVariant: ProductVariant.createdAt üzerinden 'en az bir varyant' koşulu ekler", async () => {
        await productRepository().listProducts({ page: 1, limit: 20, hasNewVariant: true })

        const where = prismaMock.product.findMany.mock.calls[0]?.[0]?.where
        expect(where.AND).toContainEqual({
            variants: { some: { createdAt: { gte: expect.any(Date) } } },
        })
    })

    it("onCampaign: yalnız ACTIVE + tarih penceresi içindeki kampanyaların varyantlarını arar", async () => {
        await productRepository().listProducts({ page: 1, limit: 20, onCampaign: true })

        const where = prismaMock.product.findMany.mock.calls[0]?.[0]?.where
        const [campaignClause] = where.AND as any[]

        expect(campaignClause.variants.some.campaignItems.some.campaign.status).toBe("ACTIVE")
        expect(campaignClause.variants.some.campaignItems.some.campaign.AND).toBeDefined()
    })

    it("hasNewVariant + onCampaign BİRLİKTE istenirse ikisi de kalır (aynı 'variants' anahtarı birbirini SESSİZCE ezmez)", async () => {
        await productRepository().listProducts({ page: 1, limit: 20, hasNewVariant: true, onCampaign: true })

        const where = prismaMock.product.findMany.mock.calls[0]?.[0]?.where
        const andClauses = where.AND as any[]

        expect(andClauses).toContainEqual({
            variants: { some: { createdAt: { gte: expect.any(Date) } } },
        })
        expect(
            andClauses.some((clause) => clause?.variants?.some?.campaignItems?.some?.campaign?.status === "ACTIVE"),
        ).toBe(true)
    })

    it("hiçbiri istenmezse AND dizisi eklenmez", async () => {
        await productRepository().listProducts({ page: 1, limit: 20 })

        const where = prismaMock.product.findMany.mock.calls[0]?.[0]?.where
        expect(where.AND).toBeUndefined()
    })
})
