import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({
    asset: {
        create: vi.fn(),
        updateMany: vi.fn(),
        findFirst: vi.fn(),
    },
}))

vi.mock("@/core/db/prisma", () => ({ prisma: prismaMock }))

import { assetRepository } from "./repository"

describe("assetRepository", () => {
    beforeEach(() => {
        prismaMock.asset.create.mockReset()
        prismaMock.asset.updateMany.mockReset()
        prismaMock.asset.findFirst.mockReset()

        prismaMock.asset.create.mockResolvedValue({ id: "asset-1" })
        prismaMock.asset.updateMany.mockResolvedValue({ count: 1 })
        prismaMock.asset.findFirst.mockResolvedValue({
            id: "asset-1",
            key: "categories/x/primary/asset-1.png",
            role: "PRIMARY",
        })
    })

    describe("createPendingAsset", () => {
        it("satırı PENDING_UPLOAD olarak yazar", async () => {
            await assetRepository().createPendingAsset({
                key: "categories/x/primary/asset-1.png",
                mimeType: "image/png",
                type: "IMAGE",
                role: "PRIMARY",
                category: { connect: { id: "cat-1" } },
            })

            const call = prismaMock.asset.create.mock.calls[0][0]
            expect(call.data.uploadStatus).toBe("PENDING_UPLOAD")
            expect(call.data.key).toBe("categories/x/primary/asset-1.png")
        })

        it("çağıran ACTIVE göndermeye çalışsa bile PENDING_UPLOAD kalır", async () => {
            await assetRepository().createPendingAsset({
                key: "k",
                mimeType: "image/png",
                type: "IMAGE",
                role: "GALLERY",
                uploadStatus: "ACTIVE",
            } as never)

            expect(prismaMock.asset.create.mock.calls[0][0].data.uploadStatus).toBe("PENDING_UPLOAD")
        })
    })

    describe("confirmUploadedAsset", () => {
        it("yalnız PENDING_UPLOAD satırı ACTIVE'e çevirir ve uploadedAt yazar", async () => {
            await assetRepository().confirmUploadedAsset("categories/x/primary/asset-1.png")

            const call = prismaMock.asset.updateMany.mock.calls[0][0]
            expect(call.where).toMatchObject({
                key: "categories/x/primary/asset-1.png",
                uploadStatus: "PENDING_UPLOAD",
            })
            expect(call.data.uploadStatus).toBe("ACTIVE")
            expect(call.data.uploadedAt).toBeInstanceOf(Date)
        })

        it("zaten ACTIVE / tekrar teslim ise no-op (count 0) döner ama satırı yine getirir", async () => {
            prismaMock.asset.updateMany.mockResolvedValue({ count: 0 })

            const result = await assetRepository().confirmUploadedAsset("k")

            expect(result.count).toBe(0)
            expect(result.asset).toMatchObject({ id: "asset-1" })
        })
    })
})
