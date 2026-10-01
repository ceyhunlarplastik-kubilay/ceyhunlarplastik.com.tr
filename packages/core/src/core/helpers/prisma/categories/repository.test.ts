import { beforeEach, describe, expect, it, vi } from "vitest"

import type { AuditContext } from "@/core/helpers/audit/types"

// Global istemcide YALNIZ `$transaction` var: yazma yolu transaction dışına (global
// `prisma.category.*` / `prisma.auditLog.*`) kaçarsa test TypeError ile düşer.
const tx = vi.hoisted(() => ({
    $queryRaw: vi.fn(),
    category: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findUniqueOrThrow: vi.fn(),
    },
    auditLog: {
        create: vi.fn(),
    },
}))

const prismaMock = vi.hoisted(() => ({
    $transaction: vi.fn(),
}))

vi.mock("@/core/db/prisma", () => ({ prisma: prismaMock }))

import { categoryRepository, createCategoryInTransaction } from "./repository"

const now = new Date("2026-09-30T10:00:00.000Z")

const audit: AuditContext = {
    actor: {
        type: "USER",
        userId: "user-1",
        cognitoSub: "sub-1",
        email: "kubilay@example.com",
        name: "Kubilay Uysal",
        groups: ["admin"],
    },
    source: "PUT /categories/{id}",
    requestId: "req-1",
    ipAddress: "203.0.113.7",
    userAgent: "Mozilla/5.0",
}

const translation = (locale: string, name: string, slug: string) => ({
    id: `translation-${locale}`,
    categoryId: "category-1",
    locale,
    name,
    slug,
    createdAt: now,
    updatedAt: now,
})

const categoryRow = (overrides: Record<string, unknown> = {}) => ({
    id: "category-1",
    code: 10,
    name: "Bakalit Tutamak",
    slug: "bakalit-tutamak",
    allowedAttributeValueIds: [] as string[],
    createdAt: now,
    updatedAt: now,
    assets: [],
    translations: [translation("tr", "Bakalit Tutamak", "bakalit-tutamak")],
    ...overrides,
})

const writtenAuditLog = () => tx.auditLog.create.mock.calls[0][0].data

describe("categoryRepository — denetimli yazmalar", () => {
    beforeEach(() => {
        vi.resetAllMocks()
        prismaMock.$transaction.mockImplementation(
            async (run: (client: typeof tx) => Promise<unknown>) => run(tx),
        )
        tx.auditLog.create.mockResolvedValue({ id: "audit-1" })
        tx.$queryRaw.mockResolvedValue([{ id: "category-1" }])
    })

    describe("createCategory", () => {
        it("kategoriyi ve CREATE kaydını aynı transaction'da yazar", async () => {
            tx.category.create.mockResolvedValue(categoryRow())

            const category = await categoryRepository().createCategory(
                { code: 10, name: "Bakalit Tutamak", slug: "bakalit-tutamak" },
                { ...audit, source: "POST /categories" },
            )

            expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
            expect(category.name).toBe("Bakalit Tutamak")
            expect(writtenAuditLog()).toMatchObject({
                entityType: "Category",
                entityId: "category-1",
                entityLabel: "10 · Bakalit Tutamak",
                action: "CREATE",
                actorUserId: "user-1",
                actorEmail: "kubilay@example.com",
                source: "POST /categories",
                changes: [
                    { field: "code", before: null, after: 10 },
                    { field: "name", before: null, after: "Bakalit Tutamak" },
                    { field: "slug", before: null, after: "bakalit-tutamak" },
                ],
            })
        })

        it("denetim kaydı yazılamazsa hatayı yükseltir: transaction geri alınır, kayıtsız kategori kalmaz", async () => {
            tx.category.create.mockResolvedValue(categoryRow())
            tx.auditLog.create.mockRejectedValue(new Error("audit write failed"))

            await expect(
                categoryRepository().createCategory({ code: 10, name: "Kulp", slug: "kulp" }, audit),
            ).rejects.toThrow("audit write failed")
        })

        it("createCategoryInTransaction çağıranın transaction'ını ve metadata'sını kullanır", async () => {
            tx.category.create.mockResolvedValue(categoryRow())

            await createCategoryInTransaction(
                tx as never,
                { code: 10, name: "Bakalit Tutamak", slug: "bakalit-tutamak" },
                audit,
                { businessRequestId: "request-1" },
            )

            expect(prismaMock.$transaction).not.toHaveBeenCalled()
            expect(writtenAuditLog()).toMatchObject({
                action: "CREATE",
                metadata: { businessRequestId: "request-1" },
            })
        })
    })

    describe("updateCategory", () => {
        it("satırı kilitler, önceki hâli okur ve yalnız değişen alanları kaydeder", async () => {
            tx.category.findUniqueOrThrow.mockResolvedValue(categoryRow())
            tx.category.update.mockResolvedValue(categoryRow({
                name: "Bakalit Tutamaklar",
                slug: "bakalit-tutamaklar",
                translations: [translation("tr", "Bakalit Tutamaklar", "bakalit-tutamaklar")],
            }))

            const category = await categoryRepository().updateCategory(
                "category-1",
                { name: "Bakalit Tutamaklar", slug: "bakalit-tutamaklar" },
                audit,
            )

            expect(category.name).toBe("Bakalit Tutamaklar")
            expect(writtenAuditLog()).toMatchObject({
                entityId: "category-1",
                entityLabel: "10 · Bakalit Tutamaklar",
                action: "UPDATE",
                changes: [
                    { field: "name", before: "Bakalit Tutamak", after: "Bakalit Tutamaklar" },
                    { field: "slug", before: "bakalit-tutamak", after: "bakalit-tutamaklar" },
                ],
            })

            const [lockOrder] = tx.$queryRaw.mock.invocationCallOrder
            const [readOrder] = tx.category.findUniqueOrThrow.mock.invocationCallOrder
            const [updateOrder] = tx.category.update.mock.invocationCallOrder
            const [auditOrder] = tx.auditLog.create.mock.invocationCallOrder
            expect(lockOrder).toBeLessThan(readOrder)
            expect(readOrder).toBeLessThan(updateOrder)
            expect(updateOrder).toBeLessThan(auditOrder)
        })

        it("çeviri ve izinli değer değişikliklerini alan yollarıyla kaydeder", async () => {
            tx.category.findUniqueOrThrow.mockResolvedValue(categoryRow({
                allowedAttributeValueIds: ["value-a"],
                translations: [
                    translation("tr", "Bakalit Tutamak", "bakalit-tutamak"),
                    translation("en", "Bakelite Handle", "bakelite-handle"),
                ],
            }))
            tx.category.update.mockResolvedValue(categoryRow({
                allowedAttributeValueIds: ["value-b", "value-a"],
                translations: [
                    translation("tr", "Bakalit Tutamak", "bakalit-tutamak"),
                    translation("en", "Bakelite Handles", "bakelite-handle"),
                ],
            }))

            await categoryRepository().updateCategory("category-1", {}, audit)

            expect(writtenAuditLog().changes).toEqual([
                { field: "allowedAttributeValueIds", before: ["value-a"], after: ["value-a", "value-b"] },
                { field: "translations.en.name", before: "Bakelite Handle", after: "Bakelite Handles" },
            ])
        })

        it("denetlenen hiçbir alan değişmediyse kayıt yazmaz", async () => {
            tx.category.findUniqueOrThrow.mockResolvedValue(categoryRow())
            tx.category.update.mockResolvedValue(categoryRow({ updatedAt: new Date("2026-09-30T11:00:00.000Z") }))

            await categoryRepository().updateCategory("category-1", {}, audit)

            expect(tx.category.update).toHaveBeenCalledTimes(1)
            expect(tx.auditLog.create).not.toHaveBeenCalled()
        })

        it("kategori yoksa P2025'i yükseltir; güncelleme ve kayıt yapılmaz", async () => {
            const notFound = Object.assign(new Error("No Category found"), { code: "P2025" })
            tx.$queryRaw.mockResolvedValue([])
            tx.category.findUniqueOrThrow.mockRejectedValue(notFound)

            await expect(
                categoryRepository().updateCategory("missing", { name: "X" }, audit),
            ).rejects.toBe(notFound)

            expect(tx.category.update).not.toHaveBeenCalled()
            expect(tx.auditLog.create).not.toHaveBeenCalled()
        })

        it("includeAllAssets seçeneğini güncelleme sorgusuna taşır", async () => {
            tx.category.findUniqueOrThrow.mockResolvedValue(categoryRow())
            tx.category.update.mockResolvedValue(categoryRow())

            await categoryRepository().updateCategory("category-1", {}, audit, { includeAllAssets: true })

            expect(tx.category.update.mock.calls[0][0].include.assets).toBe(true)
        })
    })

    describe("deleteCategory", () => {
        it("silinen kaydın son hâlini ve kaskadla gidenleri kaydeder", async () => {
            tx.category.findUniqueOrThrow.mockResolvedValue(categoryRow({
                allowedAttributeValueIds: ["value-a"],
                translations: [
                    translation("tr", "Bakalit Tutamak", "bakalit-tutamak"),
                    translation("en", "Bakelite Handle", "bakelite-handle"),
                ],
                assets: [{ key: "categories/bakalit-tutamak/primary/a.png" }],
                _count: { products: 4 },
            }))
            tx.category.delete.mockResolvedValue(categoryRow())

            const deleted = await categoryRepository().deleteCategory(
                "category-1",
                { ...audit, source: "DELETE /categories/{id}" },
            )

            expect(deleted.id).toBe("category-1")
            expect(writtenAuditLog()).toMatchObject({
                entityId: "category-1",
                entityLabel: "10 · Bakalit Tutamak",
                action: "DELETE",
                source: "DELETE /categories/{id}",
                changes: [
                    { field: "code", before: 10, after: null },
                    { field: "name", before: "Bakalit Tutamak", after: null },
                    { field: "slug", before: "bakalit-tutamak", after: null },
                    { field: "allowedAttributeValueIds", before: ["value-a"], after: null },
                    { field: "translations.en.name", before: "Bakelite Handle", after: null },
                    { field: "translations.en.slug", before: "bakelite-handle", after: null },
                ],
                metadata: {
                    cascade: {
                        productCount: 4,
                        assetKeys: ["categories/bakalit-tutamak/primary/a.png"],
                    },
                },
            })

            const [readOrder] = tx.category.findUniqueOrThrow.mock.invocationCallOrder
            const [deleteOrder] = tx.category.delete.mock.invocationCallOrder
            expect(readOrder).toBeLessThan(deleteOrder)
        })

        it("silme düşerse kayıt yazılmaz", async () => {
            tx.category.findUniqueOrThrow.mockResolvedValue(categoryRow({ _count: { products: 0 } }))
            tx.category.delete.mockRejectedValue(new Error("fk violation"))

            await expect(categoryRepository().deleteCategory("category-1", audit)).rejects.toThrow("fk violation")

            expect(tx.auditLog.create).not.toHaveBeenCalled()
        })
    })
})
