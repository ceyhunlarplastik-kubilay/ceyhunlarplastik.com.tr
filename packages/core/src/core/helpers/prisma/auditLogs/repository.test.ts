import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({
    auditLog: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
    },
}))

vi.mock("@/core/db/prisma", () => ({ prisma: prismaMock }))

import { auditLogRepository } from "./repository"

const entity = { entityType: "Category", entityId: "category-1" } as const

describe("auditLogRepository", () => {
    beforeEach(() => {
        vi.resetAllMocks()
        prismaMock.auditLog.findMany.mockResolvedValue([])
        prismaMock.auditLog.findFirst.mockResolvedValue(null)
        prismaMock.auditLog.count.mockResolvedValue(0)
    })

    describe("listEntityAuditLogs", () => {
        it("yalnız istenen kaydın satırlarını, en yeni en üstte ve sayfalı okur", async () => {
            prismaMock.auditLog.count.mockResolvedValue(45)

            const result = await auditLogRepository().listEntityAuditLogs({ ...entity, page: 3, limit: 20 })

            const query = prismaMock.auditLog.findMany.mock.calls[0][0]
            expect(query.where).toEqual({ entityType: "Category", entityId: "category-1" })
            expect(query.orderBy).toEqual([{ createdAt: "desc" }, { id: "desc" }])
            expect(query.skip).toBe(40)
            expect(query.take).toBe(20)
            expect(prismaMock.auditLog.count).toHaveBeenCalledWith({
                where: { entityType: "Category", entityId: "category-1" },
            })
            expect(result.meta).toEqual({ page: 3, limit: 20, total: 45, totalPages: 3 })
        })

        it("cognito sub'ı seçmez", async () => {
            await auditLogRepository().listEntityAuditLogs({ ...entity, page: 1, limit: 20 })

            const { select } = prismaMock.auditLog.findMany.mock.calls[0][0]
            expect(select).not.toHaveProperty("actorCognitoSub")
            expect(select).toMatchObject({ actorName: true, changes: true, createdAt: true })
        })
    })

    describe("getEntityAuditBoundaries", () => {
        it("CREATE kaydını ve en yeni kaydı ayrı ayrı okur", async () => {
            const creation = { id: "audit-create" }
            const latest = { id: "audit-latest" }
            prismaMock.auditLog.findFirst
                .mockResolvedValueOnce(creation)
                .mockResolvedValueOnce(latest)

            const boundaries = await auditLogRepository().getEntityAuditBoundaries(entity)

            expect(boundaries).toEqual({ creation, latest })
            expect(prismaMock.auditLog.findFirst.mock.calls[0][0]).toMatchObject({
                where: { entityType: "Category", entityId: "category-1", action: "CREATE" },
                orderBy: { createdAt: "asc" },
            })
            expect(prismaMock.auditLog.findFirst.mock.calls[1][0]).toMatchObject({
                where: { entityType: "Category", entityId: "category-1" },
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            })
        })
    })
})
