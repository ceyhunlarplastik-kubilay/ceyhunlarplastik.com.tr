import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Kampanya kalemlerinin yazma sözleşmesi.
 *
 * En kritik iki kural:
 *  - Aynı varyant iki kez gelirse tekilleştirilir; aksi hâlde
 *    `@@unique([campaignId, productVariantId])` ihlali 500'e dönüşür.
 *  - Güncellemede kalem listesi GÖNDERİLMEZSE mevcut kalemlere dokunulmaz;
 *    gönderilirse tam değişim yapılır.
 */

const prismaMock = vi.hoisted(() => {
    const productVariantCampaign = {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        delete: vi.fn(),
    }
    const productVariantCampaignItem = {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
    }

    return {
        productVariantCampaign,
        productVariantCampaignItem,
        $transaction: vi.fn(async (callback: (tx: unknown) => unknown) =>
            callback({ productVariantCampaign, productVariantCampaignItem }),
        ),
    }
})

vi.mock("@/core/db/prisma", () => ({ prisma: prismaMock }))

import { productVariantCampaignRepository } from "./repository"

const baseCampaign = { title: "Stok Eritme", discountPercent: 15 } as never

describe("productVariantCampaignRepository", () => {
    beforeEach(() => {
        prismaMock.productVariantCampaign.create.mockReset()
        prismaMock.productVariantCampaign.update.mockReset()
        prismaMock.productVariantCampaign.findUnique.mockReset()
        prismaMock.productVariantCampaign.findMany.mockReset()
        prismaMock.productVariantCampaignItem.deleteMany.mockReset()
        prismaMock.productVariantCampaignItem.createMany.mockReset()
        prismaMock.productVariantCampaign.findUnique.mockResolvedValue({ id: "camp-1" })
        prismaMock.productVariantCampaign.create.mockResolvedValue({ id: "camp-1" })
    })

    it("kalemleri sıralı ve varyant bazlı oranıyla yazar", async () => {
        await productVariantCampaignRepository().createCampaign(baseCampaign, [
            { productVariantId: "var-1" },
            { productVariantId: "var-2", discountPercent: 25 },
        ])

        expect(prismaMock.productVariantCampaign.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    items: {
                        create: [
                            { productVariantId: "var-1", discountPercent: null, displayOrder: 0 },
                            { productVariantId: "var-2", discountPercent: 25, displayOrder: 1 },
                        ],
                    },
                }),
            }),
        )
    })

    it("aynı varyant iki kez gelirse tekilleştirir", async () => {
        await productVariantCampaignRepository().createCampaign(baseCampaign, [
            { productVariantId: "var-1" },
            { productVariantId: "var-1", discountPercent: 40 },
            { productVariantId: "var-2" },
        ])

        const call = prismaMock.productVariantCampaign.create.mock.calls[0][0]
        expect(call.data.items.create.map((item: { productVariantId: string }) => item.productVariantId))
            .toEqual(["var-1", "var-2"])
    })

    it("boş varyant kimliğini atar", async () => {
        await productVariantCampaignRepository().createCampaign(baseCampaign, [
            { productVariantId: "" },
            { productVariantId: "var-2" },
        ])

        const call = prismaMock.productVariantCampaign.create.mock.calls[0][0]
        expect(call.data.items.create).toHaveLength(1)
    })

    it("güncellemede kalem listesi verilmezse kalemlere DOKUNMAZ", async () => {
        await productVariantCampaignRepository().updateCampaign("camp-1", { title: "Yeni" })

        expect(prismaMock.productVariantCampaignItem.deleteMany).not.toHaveBeenCalled()
        expect(prismaMock.productVariantCampaignItem.createMany).not.toHaveBeenCalled()
    })

    it("kalem listesi verilirse tam değişim yapar", async () => {
        await productVariantCampaignRepository().updateCampaign("camp-1", {}, [
            { productVariantId: "var-9" },
        ])

        expect(prismaMock.productVariantCampaignItem.deleteMany).toHaveBeenCalledWith({
            where: { campaignId: "camp-1" },
        })
        expect(prismaMock.productVariantCampaignItem.createMany).toHaveBeenCalledWith({
            data: [{ productVariantId: "var-9", discountPercent: null, displayOrder: 0, campaignId: "camp-1" }],
        })
    })

    it("boş kalem listesi tüm kalemleri siler ama createMany çağırmaz", async () => {
        await productVariantCampaignRepository().updateCampaign("camp-1", {}, [])

        expect(prismaMock.productVariantCampaignItem.deleteMany).toHaveBeenCalled()
        expect(prismaMock.productVariantCampaignItem.createMany).not.toHaveBeenCalled()
    })

    it("portal listesi yalnız ACTIVE ve tarih penceresindekileri ister", async () => {
        prismaMock.productVariantCampaign.findMany.mockResolvedValueOnce([])
        const now = new Date("2026-08-14T00:00:00.000Z")

        await productVariantCampaignRepository().listActiveCampaigns(now)

        const call = prismaMock.productVariantCampaign.findMany.mock.calls[0][0]
        expect(call.where.status).toBe("ACTIVE")
        expect(call.where.AND).toEqual([
            { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
            { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
        ])
    })
})
