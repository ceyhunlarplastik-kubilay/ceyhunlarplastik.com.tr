import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({
    asset: {
        updateMany: vi.fn(),
        findFirst: vi.fn(),
    },
}))

vi.mock("@/core/db/prisma", () => ({ prisma: prismaMock }))

import { handler } from "./confirmCategoryAssetUpload"

const s3Event = (key: string) => ({
    Records: [{ s3: { object: { key } } }],
})

describe("confirmCategoryAssetUpload handler", () => {
    beforeEach(() => {
        prismaMock.asset.updateMany.mockReset()
        prismaMock.asset.findFirst.mockReset()

        prismaMock.asset.updateMany.mockResolvedValue({ count: 1 })
        prismaMock.asset.findFirst.mockResolvedValue({
            id: "asset-1",
            key: "categories/kapak/primary/asset-1.png",
            role: "GALLERY",
            categoryId: "cat-1",
        })
    })

    it("categories/ anahtarında PENDING satırı ACTIVE'e çevirir", async () => {
        await handler(s3Event("categories/kapak/primary/asset-1.png"))

        const call = prismaMock.asset.updateMany.mock.calls[0][0]
        expect(call.where).toMatchObject({
            key: "categories/kapak/primary/asset-1.png",
            uploadStatus: "PENDING_UPLOAD",
        })
        expect(call.data.uploadStatus).toBe("ACTIVE")
        expect(call.data.uploadedAt).toBeInstanceOf(Date)
    })

    it("S3 key'ini decode eder ( + → boşluk )", async () => {
        await handler(s3Event("categories/eski+kapak/primary/a+b.png"))

        expect(prismaMock.asset.updateMany.mock.calls[0][0].where.key).toBe(
            "categories/eski kapak/primary/a b.png",
        )
    })

    it("categories/ dışındaki anahtarları atlar (repo'ya hiç gitmez)", async () => {
        await handler(s3Event("products/xyz/primary/asset-9.png"))

        expect(prismaMock.asset.updateMany).not.toHaveBeenCalled()
    })

    it("count 0 (zaten ACTIVE / satır yok) → hata atmaz, demote çağrılmaz", async () => {
        prismaMock.asset.updateMany.mockResolvedValueOnce({ count: 0 })

        await expect(
            handler(s3Event("categories/kapak/primary/asset-1.png")),
        ).resolves.toBeUndefined()
        expect(prismaMock.asset.updateMany).toHaveBeenCalledTimes(1)
    })

    it("onaylanan satır PRIMARY ise kategorinin diğer PRIMARY'lerini düşürür", async () => {
        prismaMock.asset.findFirst.mockResolvedValue({
            id: "asset-1",
            key: "categories/kapak/primary/asset-1.png",
            role: "PRIMARY",
            categoryId: "cat-1",
        })

        await handler(s3Event("categories/kapak/primary/asset-1.png"))

        expect(prismaMock.asset.updateMany).toHaveBeenCalledTimes(2)
        const demote = prismaMock.asset.updateMany.mock.calls[1][0]
        expect(demote.where).toMatchObject({
            categoryId: "cat-1",
            role: "PRIMARY",
            id: { not: "asset-1" },
        })
        expect(demote.data).toEqual({ role: "GALLERY" })
    })

    it("onaylanan satır PRIMARY değilse demote yok", async () => {
        await handler(s3Event("categories/kapak/gallery/asset-1.png"))

        expect(prismaMock.asset.updateMany).toHaveBeenCalledTimes(1)
    })
})
