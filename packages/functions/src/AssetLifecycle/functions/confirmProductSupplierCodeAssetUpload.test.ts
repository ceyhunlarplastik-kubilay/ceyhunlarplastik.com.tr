import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({
    asset: {
        updateMany: vi.fn(),
        findFirst: vi.fn(),
    },
}))

vi.mock("@/core/db/prisma", () => ({ prisma: prismaMock }))

import { handler } from "./confirmProductSupplierCodeAssetUpload"

const s3Event = (key: string) => ({
    Records: [{ s3: { object: { key } } }],
})

describe("confirmProductSupplierCodeAssetUpload handler", () => {
    beforeEach(() => {
        prismaMock.asset.updateMany.mockReset()
        prismaMock.asset.findFirst.mockReset()

        prismaMock.asset.updateMany.mockResolvedValue({ count: 1 })
        prismaMock.asset.findFirst.mockResolvedValue({
            id: "asset-1",
            key: "product-supplier-codes/p1/code-1/asset-1.png",
            productSupplierCodeId: "code-1",
        })
    })

    it("product-supplier-codes/ anahtarında PENDING satırı ACTIVE'e çevirir", async () => {
        await handler(s3Event("product-supplier-codes/p1/code-1/asset-1.png"))

        const call = prismaMock.asset.updateMany.mock.calls[0][0]
        expect(call.where).toMatchObject({
            key: "product-supplier-codes/p1/code-1/asset-1.png",
            uploadStatus: "PENDING_UPLOAD",
        })
        expect(call.data.uploadStatus).toBe("ACTIVE")
        expect(call.data.uploadedAt).toBeInstanceOf(Date)
    })

    it("S3 key'ini decode eder ( + → boşluk )", async () => {
        await handler(s3Event("product-supplier-codes/p1/code-1/a+b.png"))

        expect(prismaMock.asset.updateMany.mock.calls[0][0].where.key).toBe(
            "product-supplier-codes/p1/code-1/a b.png",
        )
    })

    it("başka prefix'li anahtarları atlar (repo'ya hiç gitmez)", async () => {
        await handler(s3Event("categories/kapak/primary/asset-9.png"))

        expect(prismaMock.asset.updateMany).not.toHaveBeenCalled()
    })

    it("count 0 (zaten ACTIVE / satır yok) → hata atmaz", async () => {
        prismaMock.asset.updateMany.mockResolvedValueOnce({ count: 0 })

        await expect(
            handler(s3Event("product-supplier-codes/p1/code-1/asset-1.png")),
        ).resolves.toBeUndefined()
        expect(prismaMock.asset.updateMany).toHaveBeenCalledTimes(1)
    })
})
