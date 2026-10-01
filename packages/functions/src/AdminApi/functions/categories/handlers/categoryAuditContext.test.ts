import { beforeEach, describe, expect, it, vi } from "vitest"

const deleteS3Objects = vi.hoisted(() => vi.fn())

vi.mock("@/core/helpers/s3/deleteObjects", () => ({ deleteS3Objects }))

import type { IAuthenticatedUser } from "@/core/helpers/utils/api/types"
import type {
    ICreateCategoryEvent,
    IDeleteCategoryEvent,
    IUpdateCategoryEvent,
} from "@/functions/AdminApi/types/categories"

import { createCategoryHandler } from "./createCategoryHandler"
import { deleteCategoryHandler } from "./deleteCategoryHandler"
import { updateCategoryHandler } from "./updateCategoryHandler"

/**
 * Kategori yazma uçları denetim bağlamını İSTEKTEN kurup repository'ye geçirir. Aktör
 * yalnız `event.user`'dan gelir; kimliksiz istekte hiçbir şey yazılmaz.
 */
const CATEGORY_ID = "11111111-1111-1111-1111-111111111111"
const now = new Date("2026-09-30T10:00:00.000Z")

const user: IAuthenticatedUser = {
    id: "user-1",
    dbUserId: "user-1",
    cognitoSub: "sub-1",
    identifier: "editor",
    firstName: "Veri",
    lastName: "Girişi",
    email: "editor@example.com",
    groups: ["content_editor"],
    accessStatus: "ACTIVE",
    isOwner: false,
    isAdmin: false,
    isSupplier: false,
    isPurchasing: false,
    isSales: false,
    isSalesDirector: false,
    isCustomer: false,
    isContentEditor: true,
    isProductionPlanner: false,
}

const category = {
    id: CATEGORY_ID,
    code: 10,
    name: "Bakalit Tutamak",
    slug: "bakalit-tutamak",
    allowedAttributeValueIds: [],
    translations: [],
    assets: [],
    createdAt: now,
    updatedAt: now,
}

const categoryRepository = {
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    getCategory: vi.fn(),
}
const assetRepository = {
    listAssetsByCategoryId: vi.fn(),
    createAsset: vi.fn(),
    unsetCategoryPrimaryAssets: vi.fn(),
}
const deps = {
    categoryRepository: categoryRepository as never,
    assetRepository: assetRepository as never,
    productAttributeValueRepository: {} as never,
}

const requestOf = (routeKey: string, authenticated = true) => ({
    ...(authenticated ? { user } : {}),
    routeKey,
    requestContext: {
        requestId: "req-1",
        http: { sourceIp: "203.0.113.7", userAgent: "Mozilla/5.0" },
    },
})

const expectedContext = (source: string) => ({
    actor: {
        type: "USER",
        userId: "user-1",
        cognitoSub: "sub-1",
        email: "editor@example.com",
        name: "Veri Girişi",
        groups: ["content_editor"],
    },
    source,
    requestId: "req-1",
    ipAddress: "203.0.113.7",
    userAgent: "Mozilla/5.0",
})

describe("kategori yazma uçları — denetim bağlamı", () => {
    beforeEach(() => {
        vi.resetAllMocks()
        categoryRepository.createCategory.mockResolvedValue(category)
        categoryRepository.updateCategory.mockResolvedValue(category)
        categoryRepository.deleteCategory.mockResolvedValue(category)
        assetRepository.listAssetsByCategoryId.mockResolvedValue([])
    })

    it("POST /categories bağlamı repository'ye geçirir", async () => {
        await createCategoryHandler(deps)({
            ...requestOf("POST /categories"),
            body: { code: 10, name: "Bakalit Tutamak" },
        } as unknown as ICreateCategoryEvent)

        expect(categoryRepository.createCategory).toHaveBeenCalledTimes(1)
        expect(categoryRepository.createCategory.mock.calls[0][1]).toEqual(expectedContext("POST /categories"))
    })

    it("PUT /categories/{id} bağlamı repository'ye geçirir", async () => {
        await updateCategoryHandler(deps)({
            ...requestOf("PUT /categories/{id}"),
            pathParameters: { id: CATEGORY_ID },
            body: { name: "Bakalit Tutamaklar" },
        } as unknown as IUpdateCategoryEvent)

        const [id, , audit, options] = categoryRepository.updateCategory.mock.calls[0]
        expect(id).toBe(CATEGORY_ID)
        expect(audit).toEqual(expectedContext("PUT /categories/{id}"))
        expect(options).toEqual({ includeAllAssets: true })
    })

    it("DELETE /categories/{id} bağlamı repository'ye geçirir", async () => {
        await deleteCategoryHandler(deps)({
            ...requestOf("DELETE /categories/{id}"),
            pathParameters: { id: CATEGORY_ID },
        } as unknown as IDeleteCategoryEvent)

        expect(categoryRepository.deleteCategory).toHaveBeenCalledWith(
            CATEGORY_ID,
            expectedContext("DELETE /categories/{id}"),
        )
    })

    it("gövdedeki sahte kimlik alanları aktörü değiştiremez", async () => {
        await expect(
            updateCategoryHandler(deps)({
                ...requestOf("PUT /categories/{id}"),
                pathParameters: { id: CATEGORY_ID },
                body: { name: "Bakalit Tutamaklar", actorUserId: "someone-else" },
            } as unknown as IUpdateCategoryEvent),
        ).rejects.toMatchObject({ statusCode: 400 })

        expect(categoryRepository.updateCategory).not.toHaveBeenCalled()
    })

    it("kimliği doğrulanmamış istekte 401 döner ve hiçbir şey yazmaz / silmez", async () => {
        await expect(
            createCategoryHandler(deps)({
                ...requestOf("POST /categories", false),
                body: { code: 10, name: "Bakalit Tutamak" },
            } as unknown as ICreateCategoryEvent),
        ).rejects.toMatchObject({ statusCode: 401 })

        await expect(
            updateCategoryHandler(deps)({
                ...requestOf("PUT /categories/{id}", false),
                pathParameters: { id: CATEGORY_ID },
                body: { name: "Bakalit Tutamaklar" },
            } as unknown as IUpdateCategoryEvent),
        ).rejects.toMatchObject({ statusCode: 401 })

        await expect(
            deleteCategoryHandler(deps)({
                ...requestOf("DELETE /categories/{id}", false),
                pathParameters: { id: CATEGORY_ID },
            } as unknown as IDeleteCategoryEvent),
        ).rejects.toMatchObject({ statusCode: 401 })

        expect(categoryRepository.createCategory).not.toHaveBeenCalled()
        expect(categoryRepository.updateCategory).not.toHaveBeenCalled()
        expect(categoryRepository.deleteCategory).not.toHaveBeenCalled()
        // Silme ucu S3 nesnelerini kayıttan ÖNCE siliyor; kimliksiz istek oraya hiç ulaşmamalı.
        expect(deleteS3Objects).not.toHaveBeenCalled()
    })
})
