import { beforeEach, describe, expect, it, vi } from "vitest"

const generateCategoryAssetUpload = vi.hoisted(() => vi.fn())

vi.mock("@/core/helpers/s3/presign", () => ({ generateCategoryAssetUpload }))

import { createCategoryAssetUploadHandler } from "./createCategoryAssetUploadHandler"
import type { ICreateCategoryAssetUploadEvent } from "@/functions/AdminApi/types/categories"

const createPendingAsset = vi.fn()
const deps = { assetRepository: { createPendingAsset } as never }

type PresignPayload = { uploadUrl: string; key: string; url: string; assetId: string }

const run = async (body: Record<string, unknown>) => {
    const res = await createCategoryAssetUploadHandler(deps)(
        { body } as unknown as ICreateCategoryAssetUploadEvent,
    )
    return (res.body as { payload: PresignPayload }).payload
}

describe("createCategoryAssetUploadHandler", () => {
    beforeEach(() => {
        createPendingAsset.mockReset()
        generateCategoryAssetUpload.mockReset()
        generateCategoryAssetUpload.mockImplementation(async ({ assetId }: { assetId: string }) => ({
            uploadUrl: "https://s3.example/put",
            key: `categories/kapak/primary/${assetId}.png`,
            url: `https://cdn.example/categories/kapak/primary/${assetId}.png`,
        }))
    })

    it("categoryId + assetType verilince PENDING_UPLOAD satırı oluşturur (id'li key)", async () => {
        const payload = await run({
            categoryId: "11111111-1111-1111-1111-111111111111",
            categorySlug: "kapak",
            assetRole: "PRIMARY",
            assetType: "IMAGE",
            fileName: "x.png",
            contentType: "image/png",
        })

        expect(createPendingAsset).toHaveBeenCalledTimes(1)
        const arg = createPendingAsset.mock.calls[0][0]
        expect(arg.id).toBe(generateCategoryAssetUpload.mock.calls[0][0].assetId)
        expect(arg.key).toBe(`categories/kapak/primary/${arg.id}.png`)
        expect(arg.type).toBe("IMAGE")
        expect(arg.role).toBe("PRIMARY")
        expect(arg.category).toEqual({ connect: { id: "11111111-1111-1111-1111-111111111111" } })
        expect(payload.assetId).toBe(arg.id)
    })

    it("categoryId yoksa satır oluşturmaz ama presign + assetId döner", async () => {
        const payload = await run({
            categorySlug: "kapak",
            assetRole: "PRIMARY",
            fileName: "x.png",
            contentType: "image/png",
        })

        expect(createPendingAsset).not.toHaveBeenCalled()
        expect(payload.uploadUrl).toBe("https://s3.example/put")
        expect(payload.assetId).toEqual(expect.any(String))
    })

    it("categoryId var ama assetType yoksa 400", async () => {
        await expect(
            run({
                categoryId: "11111111-1111-1111-1111-111111111111",
                categorySlug: "kapak",
                assetRole: "PRIMARY",
                fileName: "x.png",
                contentType: "image/png",
            }),
        ).rejects.toMatchObject({ statusCode: 400 })

        expect(createPendingAsset).not.toHaveBeenCalled()
    })

    it("zorunlu alan eksikse 400", async () => {
        await expect(run({ categorySlug: "kapak" })).rejects.toMatchObject({ statusCode: 400 })
    })
})
