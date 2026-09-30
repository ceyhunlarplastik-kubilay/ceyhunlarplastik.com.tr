import { describe, expect, it, vi } from "vitest"

import { deleteProductHandler } from "./deleteProductHandler"
import type { IDeleteProductEvent } from "@/functions/AdminApi/types/products"

const event = { pathParameters: { id: "product-1" } } as unknown as IDeleteProductEvent

function buildRepository(moldOutputs: number) {
    return {
        countMoldOutputs: vi.fn().mockResolvedValue(moldOutputs),
        deleteProduct: vi.fn().mockResolvedValue({ id: "product-1" }),
    }
}

describe("deleteProductHandler — kalıba bağlı ölçü koruması", () => {
    it("ölçüleri kalıba bağlı ürünü silmeye kalkmadan 409 döner", async () => {
        // `MoldOutput` → `ProductSize` Restrict: silme denenseydi FK hatası genel 500'e düşerdi.
        const productRepository = buildRepository(2)

        await expect(
            deleteProductHandler({ productRepository: productRepository as never })(event),
        ).rejects.toMatchObject({ statusCode: 409 })
        expect(productRepository.deleteProduct).not.toHaveBeenCalled()
    })

    it("kalıba bağlı ölçüsü yoksa silmeye devam eder", async () => {
        const productRepository = buildRepository(0)

        const response = await deleteProductHandler({ productRepository: productRepository as never })(event)

        expect(productRepository.deleteProduct).toHaveBeenCalledWith("product-1")
        expect(response.statusCode).toBe(200)
    })
})
