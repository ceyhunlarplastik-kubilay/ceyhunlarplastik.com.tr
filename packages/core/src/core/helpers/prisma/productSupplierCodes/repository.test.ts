import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({
    productSupplierCode: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
    },
    productVariantSupplier: {
        groupBy: vi.fn(),
    },
    asset: {
        findMany: vi.fn(),
    },
}))

vi.mock("@/core/db/prisma", () => ({ prisma: prismaMock }))

const deleteS3ObjectMock = vi.hoisted(() => vi.fn())
vi.mock("@/core/helpers/s3/deleteObject", () => ({ deleteS3Object: deleteS3ObjectMock }))

import { productSupplierCodeRepository } from "./repository"

const activeDrawing = {
    id: "asset-active",
    key: "product-supplier-codes/p1/code-1/asset-active.png",
    mimeType: "image/png",
    uploadStatus: "ACTIVE" as const,
    uploadedAt: new Date("2026-01-02T00:00:00Z"),
    createdAt: new Date("2026-01-01T00:00:00Z"),
}

const pendingDrawing = {
    id: "asset-pending",
    key: "product-supplier-codes/p1/code-1/asset-pending.png",
    mimeType: "image/png",
    uploadStatus: "PENDING_UPLOAD" as const,
    uploadedAt: null,
    createdAt: new Date("2026-02-01T00:00:00Z"),
}

describe("productSupplierCodeRepository", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        prismaMock.productVariantSupplier.groupBy.mockResolvedValue([])
    })

    describe("list", () => {
        it("en güncel ACTIVE teknik resmi technicalDrawing'e map'ler (daha yeni bir PENDING olsa bile)", async () => {
            prismaMock.productSupplierCode.findMany.mockResolvedValue([
                {
                    id: "code-1",
                    code: "A",
                    supplierId: "sup-1",
                    createdAt: new Date("2025-12-01T00:00:00Z"),
                    supplier: { id: "sup-1", name: "Özgen Plastik" },
                    // rowSelect orderBy createdAt desc → PENDING (daha yeni) önce gelir
                    assets: [pendingDrawing, activeDrawing],
                },
            ])

            const [row] = await productSupplierCodeRepository().list("p1")

            expect(row.technicalDrawing).not.toBeNull()
            expect(row.technicalDrawing?.id).toBe("asset-active")
            expect(row.technicalDrawing?.uploadStatus).toBe("ACTIVE")
            expect(row.technicalDrawing?.url).toContain("asset-active.png")
        })

        it("ACTIVE yoksa en güncel PENDING satırı gösterilir", async () => {
            prismaMock.productSupplierCode.findMany.mockResolvedValue([
                {
                    id: "code-1",
                    code: "A",
                    supplierId: "sup-1",
                    createdAt: new Date(),
                    supplier: { id: "sup-1", name: "Özgen Plastik" },
                    assets: [pendingDrawing],
                },
            ])

            const [row] = await productSupplierCodeRepository().list("p1")

            expect(row.technicalDrawing?.id).toBe("asset-pending")
            expect(row.technicalDrawing?.uploadStatus).toBe("PENDING_UPLOAD")
        })

        it("hiç teknik resim yoksa technicalDrawing null", async () => {
            prismaMock.productSupplierCode.findMany.mockResolvedValue([
                {
                    id: "code-1",
                    code: "A",
                    supplierId: "sup-1",
                    createdAt: new Date(),
                    supplier: { id: "sup-1", name: "Özgen Plastik" },
                    assets: [],
                },
            ])

            const [row] = await productSupplierCodeRepository().list("p1")

            expect(row.technicalDrawing).toBeNull()
        })

        it("rowSelect yalnız TECHNICAL_DRAWING asset'lerini ister", async () => {
            prismaMock.productSupplierCode.findMany.mockResolvedValue([])

            await productSupplierCodeRepository().list("p1")

            const call = prismaMock.productSupplierCode.findMany.mock.calls[0][0]
            expect(call.select.assets.where).toEqual({ type: "TECHNICAL_DRAWING" })
        })
    })

    describe("remove", () => {
        beforeEach(() => {
            prismaMock.productSupplierCode.findUnique.mockResolvedValue({
                id: "code-1",
                code: "A",
                productId: "p1",
                supplierId: "sup-1",
            })
            prismaMock.productSupplierCode.delete.mockResolvedValue({ id: "code-1" })
        })

        it("harf silinmeden önce teknik resimlerin S3 nesnelerini temizler", async () => {
            prismaMock.asset.findMany.mockResolvedValue([
                { key: "product-supplier-codes/p1/code-1/a.png" },
                { key: "product-supplier-codes/p1/code-1/b.png" },
            ])

            await productSupplierCodeRepository().remove({ productId: "p1", id: "code-1" })

            expect(deleteS3ObjectMock).toHaveBeenCalledWith("product-supplier-codes/p1/code-1/a.png")
            expect(deleteS3ObjectMock).toHaveBeenCalledWith("product-supplier-codes/p1/code-1/b.png")
            expect(prismaMock.productSupplierCode.delete).toHaveBeenCalledWith({ where: { id: "code-1" } })
        })

        it("harf varyantlarda kullanılıyorsa ne S3 ne DB silinir", async () => {
            prismaMock.productVariantSupplier.groupBy.mockResolvedValue([
                { supplierId: "sup-1", _count: { _all: 3 } },
            ])

            await expect(
                productSupplierCodeRepository().remove({ productId: "p1", id: "code-1" }),
            ).rejects.toThrow(/silinemez/)

            expect(deleteS3ObjectMock).not.toHaveBeenCalled()
            expect(prismaMock.productSupplierCode.delete).not.toHaveBeenCalled()
        })
    })
})
