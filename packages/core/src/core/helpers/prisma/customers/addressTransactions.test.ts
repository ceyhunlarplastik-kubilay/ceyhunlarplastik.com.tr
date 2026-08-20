import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => {
    const events: string[] = []
    const customerAddress = {
        aggregate: vi.fn(),
        updateMany: vi.fn(),
        create: vi.fn(),
    }
    const customer = {
        findUniqueOrThrow: vi.fn(),
    }

    return {
        events,
        customerAddress,
        customer,
        $transaction: vi.fn(async (callback: (tx: { customerAddress: typeof customerAddress }) => unknown) => {
            events.push("transaction:start")
            await callback({ customerAddress })
            events.push("transaction:committed")
        }),
    }
})

vi.mock("@/core/db/prisma", () => ({
    prisma: prismaMock,
}))

import { customerRepository } from "./repository"

describe("müşteri adresi transaction sınırı", () => {
    beforeEach(() => {
        prismaMock.events.length = 0
        vi.clearAllMocks()
        prismaMock.customerAddress.aggregate.mockResolvedValue({
            _max: { displayOrder: null },
        })
        prismaMock.customerAddress.create.mockResolvedValue({ id: "address-1" })
        prismaMock.customer.findUniqueOrThrow.mockImplementation(async () => {
            prismaMock.events.push("customer:detail")
            return { id: "customer-1" }
        })
    })

    it("geniş müşteri detayını adres transaction'ı commit edildikten sonra okur", async () => {
        await customerRepository().createAddress("customer-1", {
            label: "Merkez",
            city: "İstanbul",
            line1: "Örnek adres",
            isPrimary: true,
        })

        expect(prismaMock.events).toEqual([
            "transaction:start",
            "transaction:committed",
            "customer:detail",
        ])
        expect(prismaMock.$transaction).toHaveBeenCalledWith(
            expect.any(Function),
            { maxWait: 5_000, timeout: 15_000 },
        )
        expect(prismaMock.customerAddress.updateMany).toHaveBeenCalledOnce()
        expect(prismaMock.customerAddress.create).toHaveBeenCalledOnce()
        expect(prismaMock.customer.findUniqueOrThrow).toHaveBeenCalledOnce()
    })
})
