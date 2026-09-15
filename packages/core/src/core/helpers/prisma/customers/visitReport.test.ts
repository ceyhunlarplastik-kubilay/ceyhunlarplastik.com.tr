import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => {
    const customerVisit = {
        findMany: vi.fn(),
        count: vi.fn(),
    }

    return { customerVisit }
})

vi.mock("@/core/db/prisma", () => ({
    prisma: prismaMock,
}))

import { customerRepository } from "./repository"

describe("customerRepository listVisitsForReport filtreleri", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        prismaMock.customerVisit.findMany.mockResolvedValue([])
        prismaMock.customerVisit.count.mockResolvedValue(0)
    })

    it("hiçbir filtre verilmezse where boş kalır", async () => {
        await customerRepository().listVisitsForReport({})

        const where = prismaMock.customerVisit.findMany.mock.calls[0][0].where
        expect(where).toEqual({})
    })

    it("ownerUserId filtresi where'e eklenir", async () => {
        await customerRepository().listVisitsForReport({ ownerUserId: "user-1" })

        const where = prismaMock.customerVisit.findMany.mock.calls[0][0].where
        expect(where.ownerUserId).toBe("user-1")
    })

    it("status ve type birlikte filtrelenebilir", async () => {
        await customerRepository().listVisitsForReport({
            status: "COMPLETED" as never,
            type: "PHONE" as never,
        })

        const where = prismaMock.customerVisit.findMany.mock.calls[0][0].where
        expect(where.status).toBe("COMPLETED")
        expect(where.type).toBe("PHONE")
    })

    it("tarih aralığı scheduledAt gte/lte olarak eklenir", async () => {
        const scheduledFrom = new Date("2026-09-01T00:00:00.000Z")
        const scheduledTo = new Date("2026-09-30T23:59:59.999Z")

        await customerRepository().listVisitsForReport({ scheduledFrom, scheduledTo })

        const where = prismaMock.customerVisit.findMany.mock.calls[0][0].where
        expect(where.scheduledAt).toEqual({ gte: scheduledFrom, lte: scheduledTo })
    })

    it("yalnız scheduledFrom verilirse yalnız gte eklenir", async () => {
        const scheduledFrom = new Date("2026-09-01T00:00:00.000Z")

        await customerRepository().listVisitsForReport({ scheduledFrom })

        const where = prismaMock.customerVisit.findMany.mock.calls[0][0].where
        expect(where.scheduledAt).toEqual({ gte: scheduledFrom })
    })

    it("il/ilçe filtresi address alt-nesnesine eklenir", async () => {
        await customerRepository().listVisitsForReport({ stateId: 34, cityId: 1 })

        const where = prismaMock.customerVisit.findMany.mock.calls[0][0].where
        expect(where.address).toEqual({ stateId: 34, cityId: 1 })
    })

    it("yalnız stateId verilirse address filtresinde yalnız stateId olur", async () => {
        await customerRepository().listVisitsForReport({ stateId: 34 })

        const where = prismaMock.customerVisit.findMany.mock.calls[0][0].where
        expect(where.address).toEqual({ stateId: 34 })
    })

    it("sayfalama meta'sı doğru hesaplanır", async () => {
        prismaMock.customerVisit.count.mockResolvedValue(45)

        const result = await customerRepository().listVisitsForReport({ page: 2, limit: 20 })

        expect(result.meta).toEqual({ page: 2, limit: 20, total: 45, totalPages: 3 })
        expect(prismaMock.customerVisit.findMany.mock.calls[0][0].skip).toBe(20)
        expect(prismaMock.customerVisit.findMany.mock.calls[0][0].take).toBe(20)
    })

    it("sonuçlar scheduledAt sonra createdAt'e göre azalan sıralanır", async () => {
        await customerRepository().listVisitsForReport({})

        const orderBy = prismaMock.customerVisit.findMany.mock.calls[0][0].orderBy
        expect(orderBy).toEqual([
            { scheduledAt: "desc" },
            { createdAt: "desc" },
        ])
    })
})
