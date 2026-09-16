import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => {
    const customer = {
        findMany: vi.fn(),
        count: vi.fn(),
    }

    return { customer }
})

vi.mock("@/core/db/prisma", () => ({
    prisma: prismaMock,
}))

import { customerRepository } from "./repository"

describe("customerRepository listCustomers il/ilçe filtresi", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        prismaMock.customer.findMany.mockResolvedValue([])
        prismaMock.customer.count.mockResolvedValue(0)
    })

    it("hiçbir geo filtresi verilmezse where'e addresses eklenmez", async () => {
        await customerRepository().listCustomers({ page: 1, limit: 20 })

        const where = prismaMock.customer.findMany.mock.calls[0][0].where
        expect(where.addresses).toBeUndefined()
    })

    it("stateId/cityId adreslerin en az birinde eşleşecek şekilde eklenir", async () => {
        await customerRepository().listCustomers({ page: 1, limit: 20, stateId: 34, cityId: 1 })

        const where = prismaMock.customer.findMany.mock.calls[0][0].where
        expect(where.addresses).toEqual({ some: { stateId: 34, cityId: 1 } })
    })

    it("yalnız countryId verilirse addresses filtresinde yalnız countryId olur", async () => {
        await customerRepository().listCustomers({ page: 1, limit: 20, countryId: 225 })

        const where = prismaMock.customer.findMany.mock.calls[0][0].where
        expect(where.addresses).toEqual({ some: { countryId: 225 } })
    })

    it("geo filtresi sektör/durum filtreleriyle birlikte uygulanabilir", async () => {
        await customerRepository().listCustomers({
            page: 1,
            limit: 20,
            stateId: 34,
            status: "CUSTOMER" as never,
            sectorValueId: "sector-1",
        })

        const where = prismaMock.customer.findMany.mock.calls[0][0].where
        expect(where.addresses).toEqual({ some: { stateId: 34 } })
        expect(where.status).toBe("CUSTOMER")
        expect(where.sectorValueId).toBe("sector-1")
    })
})
