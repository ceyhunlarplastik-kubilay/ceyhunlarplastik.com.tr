import { beforeEach, describe, expect, it, vi } from "vitest"

const generateCategoryAssetUpload = vi.hoisted(() => vi.fn())

vi.mock("@/core/helpers/s3/presign", () => ({ generateCategoryAssetUpload }))

import { Prisma } from "@/prisma/generated/prisma/client"
import { createCategoryAssetUploadHandler } from "./createCategoryAssetUploadHandler"
import type { ICreateCategoryAssetUploadEvent } from "@/functions/AdminApi/types/categories"

const CATEGORY_ID = "3f2b8c1e-5a4d-4e6f-9a1b-2c3d4e5f6a7b"

const createPendingAsset = vi.fn()
const getCategory = vi.fn()
const deps = {
    categoryRepository: { getCategory } as never,
    assetRepository: { createPendingAsset } as never,
}

type PresignPayload = { uploadUrl: string; key: string; url: string; assetId: string }

const validBody = {
    categoryId: CATEGORY_ID,
    assetRole: "PRIMARY",
    assetType: "IMAGE",
    fileName: "x.png",
    contentType: "image/png",
}

const run = async (body: Record<string, unknown>) => {
    const res = await createCategoryAssetUploadHandler(deps)(
        { body } as unknown as ICreateCategoryAssetUploadEvent,
    )
    return (res.body as { payload: PresignPayload }).payload
}

describe("createCategoryAssetUploadHandler", () => {
    beforeEach(() => {
        vi.resetAllMocks()
        getCategory.mockResolvedValue({ id: CATEGORY_ID, slug: "bakalit-tutamaklar" })
        generateCategoryAssetUpload.mockImplementation(
            async ({ assetId, categorySlug }: { assetId: string; categorySlug: string }) => ({
                uploadUrl: "https://s3.example/put",
                key: `categories/${categorySlug}/primary/${assetId}.png`,
                url: `https://cdn.example/categories/${categorySlug}/primary/${assetId}.png`,
            }),
        )
    })

    it("anahtarı ve PENDING_UPLOAD satırını birlikte üretir (id'li key)", async () => {
        const payload = await run(validBody)

        expect(createPendingAsset).toHaveBeenCalledTimes(1)
        const arg = createPendingAsset.mock.calls[0][0]
        expect(arg.id).toBe(generateCategoryAssetUpload.mock.calls[0][0].assetId)
        expect(arg.key).toBe(`categories/bakalit-tutamaklar/primary/${arg.id}.png`)
        expect(arg.type).toBe("IMAGE")
        expect(arg.role).toBe("PRIMARY")
        expect(arg.mimeType).toBe("image/png")
        expect(arg.category).toEqual({ connect: { id: CATEGORY_ID } })
        expect(payload.assetId).toBe(arg.id)
        expect(payload.key).toBe(arg.key)
    })

    it("klasörü istemcinin slug'ından değil kategorinin kaydından alır", async () => {
        await run({ ...validBody, categorySlug: "../products/baska" })

        expect(getCategory).toHaveBeenCalledWith(CATEGORY_ID)
        expect(generateCategoryAssetUpload.mock.calls[0][0].categorySlug).toBe("bakalit-tutamaklar")
    })

    it("kategori yoksa 404; ne imza ne satır üretir", async () => {
        getCategory.mockRejectedValue(
            new Prisma.PrismaClientKnownRequestError("not found", { code: "P2025", clientVersion: "test" }),
        )

        await expect(run(validBody)).rejects.toMatchObject({ statusCode: 404 })
        expect(generateCategoryAssetUpload).not.toHaveBeenCalled()
        expect(createPendingAsset).not.toHaveBeenCalled()
    })

    it.each([
        ["izin listesinde olmayan tip", { contentType: "text/html" }],
        ["script taşıyabilen svg", { contentType: "image/svg+xml" }],
        ["asset tipine uymayan içerik", { assetType: "PDF", contentType: "image/png" }],
    ])("%s → 400, hiçbir şey üretmez", async (_label, override) => {
        await expect(run({ ...validBody, ...override })).rejects.toMatchObject({ statusCode: 400 })
        expect(getCategory).not.toHaveBeenCalled()
        expect(createPendingAsset).not.toHaveBeenCalled()
    })

    it.each(["categoryId", "assetType", "assetRole", "fileName", "contentType"])(
        "%s yoksa 400",
        async (field) => {
            const body: Record<string, unknown> = { ...validBody }
            delete body[field]

            await expect(run(body)).rejects.toMatchObject({ statusCode: 400 })
            expect(createPendingAsset).not.toHaveBeenCalled()
        },
    )
})
