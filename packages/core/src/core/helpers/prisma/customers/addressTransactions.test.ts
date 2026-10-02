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
        // Denetim kaydı için müşterinin önceki / sonraki hâli transaction İÇİNDE okunur.
        findMany: vi.fn(),
    }
    const auditLog = {
        create: vi.fn(),
    }
    const $queryRaw = vi.fn()

    return {
        events,
        customerAddress,
        customer,
        auditLog,
        $queryRaw,
        $transaction: vi.fn(async (callback: (tx: unknown) => unknown) => {
            events.push("transaction:start")
            await callback({ customerAddress, customer, auditLog, $queryRaw })
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
        prismaMock.customer.findMany.mockResolvedValue([{
            id: "customer-1",
            companyName: "Acme",
            fullName: null,
            phone: "555",
            email: "",
            websiteUrl: null,
            note: null,
            status: "LEAD",
            generalDiscountPercent: null,
            defaultPaymentTermDays: null,
            creditLimit: null,
            paymentTermNote: null,
            additionalPhones: [],
            addresses: [],
            assignedSalesUser: null,
            sectorValue: null,
            productionGroupValue: null,
            usageAreaValues: [],
            attributeValueAssignments: [],
            companyContactAssignments: [],
        }])
    })

    it("geniş müşteri detayını adres transaction'ı commit edildikten sonra okur", async () => {
        await customerRepository().createAddress("customer-1", {
            label: "Merkez",
            city: "İstanbul",
            line1: "Örnek adres",
            isPrimary: true,
        }, {
            actor: { type: "USER", userId: "u1", cognitoSub: "s1", email: "a@b.c", name: "A", groups: ["admin"] },
            source: "POST /sales/customers/{id}/addresses",
            requestId: null,
            ipAddress: null,
            userAgent: null,
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
