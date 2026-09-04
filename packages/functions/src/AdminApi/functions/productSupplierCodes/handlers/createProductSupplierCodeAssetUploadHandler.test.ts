import { beforeEach, describe, expect, it, vi } from "vitest"

const generateProductSupplierCodeAssetUpload = vi.hoisted(() => vi.fn())

vi.mock("@/core/helpers/s3/presign", () => ({ generateProductSupplierCodeAssetUpload }))

import { createProductSupplierCodeAssetUploadHandler } from "./index"
import type { ICreateProductSupplierCodeAssetUploadEvent } from "@/functions/AdminApi/types/productSupplierCodes"

const findForProduct = vi.fn()
const createPendingAsset = vi.fn()
const deps = {
    productSupplierCodeRepository: { findForProduct } as never,
    assetRepository: { createPendingAsset } as never,
}

type PresignPayload = { uploadUrl: string; key: string; url: string; assetId: string }

const PRODUCT_ID = "11111111-1111-1111-1111-111111111111"
const CODE_ID = "22222222-2222-2222-2222-222222222222"

const run = async (pathParameters: Record<string, unknown>, body: Record<string, unknown>) => {
    const res = await createProductSupplierCodeAssetUploadHandler(deps)(
        { pathParameters, body } as unknown as ICreateProductSupplierCodeAssetUploadEvent,
    )
    return (res.body as { payload: PresignPayload }).payload
}

describe("createProductSupplierCodeAssetUploadHandler", () => {
    beforeEach(() => {
        findForProduct.mockReset()
        createPendingAsset.mockReset()
        generateProductSupplierCodeAssetUpload.mockReset()
        findForProduct.mockResolvedValue({ id: CODE_ID })
        generateProductSupplierCodeAssetUpload.mockImplementation(
            async ({ assetId, productId, codeId }: { assetId: string; productId: string; codeId: string }) => ({
                uploadUrl: "https://s3.example/put",
                key: `product-supplier-codes/${productId}/${codeId}/${assetId}.png`,
                url: `https://cdn.example/product-supplier-codes/${productId}/${codeId}/${assetId}.png`,
            }),
        )
    })

    it("TECHNICAL_DRAWING PENDING_UPLOAD satırı oluşturur (id'li key, harf connect)", async () => {
        const payload = await run(
            { id: PRODUCT_ID, codeId: CODE_ID },
            { fileName: "teknik.pdf", contentType: "application/pdf" },
        )

        expect(findForProduct).toHaveBeenCalledWith({ productId: PRODUCT_ID, id: CODE_ID })
        expect(createPendingAsset).toHaveBeenCalledTimes(1)
        const arg = createPendingAsset.mock.calls[0][0]
        expect(arg.id).toBe(generateProductSupplierCodeAssetUpload.mock.calls[0][0].assetId)
        expect(arg.key).toBe(`product-supplier-codes/${PRODUCT_ID}/${CODE_ID}/${arg.id}.png`)
        expect(arg.type).toBe("TECHNICAL_DRAWING")
        expect(arg.role).toBe("TECHNICAL_DRAWING")
        expect(arg.mimeType).toBe("application/pdf")
        expect(arg.productSupplierCode).toEqual({ connect: { id: CODE_ID } })
        expect(payload.assetId).toBe(arg.id)
        expect(payload.uploadUrl).toBe("https://s3.example/put")
    })

    it("harf bu ürüne ait değilse 404 — presign de satır da yok", async () => {
        findForProduct.mockResolvedValue(null)

        await expect(
            run({ id: PRODUCT_ID, codeId: CODE_ID }, { fileName: "x.png", contentType: "image/png" }),
        ).rejects.toMatchObject({ statusCode: 404 })

        expect(generateProductSupplierCodeAssetUpload).not.toHaveBeenCalled()
        expect(createPendingAsset).not.toHaveBeenCalled()
    })

    it("zorunlu alan eksikse 400", async () => {
        await expect(
            run({ id: PRODUCT_ID, codeId: CODE_ID }, { fileName: "x.png" }),
        ).rejects.toMatchObject({ statusCode: 400 })

        expect(findForProduct).not.toHaveBeenCalled()
    })
})
