import { beforeEach, describe, expect, it, vi } from "vitest"

import type { AuditContext } from "@/core/helpers/audit/types"
import type { CustomerAuditRow } from "@/core/helpers/crm/customerAudit"

// Global istemcide yalnız `$transaction` ve commit SONRASI dönüş okuması var: yazma yolu
// transaction dışına (global `prisma.customer.update` gibi) kaçarsa test TypeError ile düşer.
const tx = vi.hoisted(() => ({
    $queryRaw: vi.fn(),
    customer: {
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
        findMany: vi.fn(),
    },
    customerAddress: {
        aggregate: vi.fn(),
        updateMany: vi.fn(),
        create: vi.fn(),
    },
    customerAttributeValueAssignment: { deleteMany: vi.fn() },
    customerCompanyContactAssignment: { deleteMany: vi.fn(), createMany: vi.fn() },
    auditLog: { create: vi.fn(), createMany: vi.fn() },
    user: { findUnique: vi.fn() },
}))

const prismaMock = vi.hoisted(() => ({
    $transaction: vi.fn(),
    customer: { findUniqueOrThrow: vi.fn() },
}))

vi.mock("@/core/db/prisma", () => ({ prisma: prismaMock }))

import {
    applyCustomerUpdateInTransaction,
    customerRepository,
    replaceSalesUserCustomersInTransaction,
} from "./repository"

const audit: AuditContext = {
    actor: { type: "USER", userId: "user-1", cognitoSub: "sub-1", email: "admin@ceyhunlar.com", name: "Admin", groups: ["admin"] },
    source: "PUT /customers/{id}",
    requestId: "req-1",
    ipAddress: "203.0.113.7",
    userAgent: "Mozilla/5.0",
}

const auditRow = (overrides: Partial<CustomerAuditRow> = {}): CustomerAuditRow => ({
    id: "customer-1",
    companyName: "Acme Plastik",
    fullName: "Ayşe Yılmaz",
    phone: "0555 111 22 33",
    email: "ayse@acme.com",
    websiteUrl: null,
    note: null,
    status: "LEAD",
    generalDiscountPercent: null,
    defaultPaymentTermDays: null,
    creditLimit: null,
    paymentTermNote: null,
    assignedSalesUserId: null,
    convertedAt: null,
    convertedByUserId: null,
    sectorValueId: null,
    productionGroupValueId: null,
    createdAt: new Date("2026-10-01T10:00:00.000Z"),
    updatedAt: new Date("2026-10-01T10:00:00.000Z"),
    additionalPhones: [],
    addresses: [],
    assignedSalesUser: null,
    sectorValue: null,
    productionGroupValue: null,
    usageAreaValues: [],
    attributeValueAssignments: [],
    companyContactAssignments: [],
    ...overrides,
}) as CustomerAuditRow

const firstCallOrder = (mock: ReturnType<typeof vi.fn>, index = 0) => mock.mock.invocationCallOrder[index]

describe("customerRepository — denetimli yazmalar", () => {
    beforeEach(() => {
        vi.resetAllMocks()
        prismaMock.$transaction.mockImplementation(async (run: (client: typeof tx) => Promise<unknown>) => run(tx))
        prismaMock.customer.findUniqueOrThrow.mockResolvedValue({ id: "customer-1" })
        tx.$queryRaw.mockResolvedValue([{ id: "customer-1" }])
        tx.customer.update.mockResolvedValue({ id: "customer-1" })
        tx.customer.create.mockResolvedValue({ id: "customer-1" })
        tx.customerAddress.aggregate.mockResolvedValue({ _max: { displayOrder: null } })
        tx.auditLog.create.mockResolvedValue({ id: "audit-1" })
        tx.auditLog.createMany.mockResolvedValue({ count: 1 })
    })

    describe("updateCustomer", () => {
        it("kilitler, önceki hâli okur, yazar, sonraki hâli okur ve farkı kaydeder", async () => {
            tx.customer.findMany
                .mockResolvedValueOnce([auditRow()])
                .mockResolvedValueOnce([auditRow({ phone: "0555 999 88 77", creditLimit: { toString: () => "50000" } as never })])

            await customerRepository().updateCustomer("customer-1", { phone: "0555 999 88 77" }, audit)

            expect(firstCallOrder(tx.$queryRaw)).toBeLessThan(firstCallOrder(tx.customer.findMany, 0))
            expect(firstCallOrder(tx.customer.findMany, 0)).toBeLessThan(firstCallOrder(tx.customer.update))
            expect(firstCallOrder(tx.customer.update)).toBeLessThan(firstCallOrder(tx.customer.findMany, 1))
            expect(tx.auditLog.create.mock.calls[0][0].data).toMatchObject({
                entityType: "Customer",
                entityId: "customer-1",
                entityLabel: "Acme Plastik",
                action: "UPDATE",
                actorUserId: "user-1",
                changes: [
                    { field: "phone", before: "0555 111 22 33", after: "0555 999 88 77" },
                    { field: "creditLimit", before: null, after: "50000" },
                ],
            })
            // Geniş dönüş okuması commit SONRASI, global istemciyle.
            expect(prismaMock.customer.findUniqueOrThrow).toHaveBeenCalledTimes(1)
        })

        it("iletişim kişisi ataması ve profil temizliği AYNI transaction'da, sonraki okumadan önce", async () => {
            tx.customer.findMany.mockResolvedValue([auditRow()])

            await customerRepository().updateCustomer("customer-1", {}, audit, {
                companyContactAssignments: [{ companyContactId: "contact-1" }],
                replaceAttributeAssignmentCodes: ["sector"],
            })

            expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
            expect(firstCallOrder(tx.customerAttributeValueAssignment.deleteMany)).toBeLessThan(firstCallOrder(tx.customer.update))
            expect(tx.customerCompanyContactAssignment.createMany.mock.calls[0][0].data).toEqual([
                expect.objectContaining({ customerId: "customer-1", companyContactId: "contact-1" }),
            ])
            expect(firstCallOrder(tx.customerCompanyContactAssignment.createMany)).toBeLessThan(
                firstCallOrder(tx.customer.findMany, 1),
            )
        })

        it("denetlenen hiçbir alan değişmediyse kayıt yazmaz", async () => {
            tx.customer.findMany.mockResolvedValue([auditRow()])

            await customerRepository().updateCustomer("customer-1", { note: null }, audit)

            expect(tx.customer.update).toHaveBeenCalledTimes(1)
            expect(tx.auditLog.create).not.toHaveBeenCalled()
        })

        it("müşteri yoksa 404; yazma ve kayıt yapılmaz", async () => {
            tx.customer.findMany.mockResolvedValue([])

            await expect(customerRepository().updateCustomer("missing", { phone: "1" }, audit))
                .rejects.toMatchObject({ statusCode: 404 })
            expect(tx.customer.update).not.toHaveBeenCalled()
            expect(tx.auditLog.create).not.toHaveBeenCalled()
        })
    })

    describe("createCustomer", () => {
        it("müşteri + adres + CREATE kaydı TEK transaction'da", async () => {
            tx.customer.findMany.mockResolvedValue([auditRow()])

            await customerRepository().createCustomer(
                { companyName: "Acme Plastik", phone: "0555 111 22 33", email: "ayse@acme.com" },
                { ...audit, source: "POST /lead-customers" },
                { address: { label: "Merkez", city: "İstanbul", line1: "Atatürk Cad. 5", isPrimary: true } },
            )

            expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
            expect(tx.customerAddress.create.mock.calls[0][0].data).toMatchObject({ customerId: "customer-1", label: "Merkez" })
            expect(firstCallOrder(tx.customerAddress.create)).toBeLessThan(firstCallOrder(tx.auditLog.create))
            expect(tx.auditLog.create.mock.calls[0][0].data).toMatchObject({
                action: "CREATE",
                source: "POST /lead-customers",
                changes: expect.arrayContaining([{ field: "companyName", before: null, after: "Acme Plastik" }]),
            })
        })

        it("kayıt yazılamazsa hatayı yükseltir (transaction geri alınır, kayıtsız müşteri kalmaz)", async () => {
            tx.customer.findMany.mockResolvedValue([auditRow()])
            tx.auditLog.create.mockRejectedValue(new Error("audit write failed"))

            await expect(customerRepository().createCustomer({ phone: "1", email: "" }, audit))
                .rejects.toThrow("audit write failed")
            expect(prismaMock.customer.findUniqueOrThrow).not.toHaveBeenCalled()
        })
    })

    it("convertCustomer bağlam bilgisini (davet) kayda yazar", async () => {
        tx.customer.findMany
            .mockResolvedValueOnce([auditRow()])
            .mockResolvedValueOnce([auditRow({ status: "CUSTOMER" })])

        await customerRepository().convertCustomer("customer-1", "staff-1", audit, { invitationId: "inv-1" })

        expect(tx.auditLog.create.mock.calls[0][0].data).toMatchObject({
            action: "UPDATE",
            changes: [{ field: "status", before: "LEAD", after: "CUSTOMER" }],
            metadata: { invitationId: "inv-1" },
        })
    })

    describe("deleteLeadCustomers", () => {
        const countRow = (id: string, overrides: Record<string, unknown> = {}) => ({
            id,
            status: "LEAD",
            fullName: null,
            companyName: `Firma ${id}`,
            _count: { orders: 0, portalUsers: 0, businessRequests: 0, visits: 2, assignedProducts: 0, specialVariantPrices: 1 },
            ...overrides,
        })

        beforeEach(() => {
            tx.customer.findMany.mockImplementation(async (args: { select?: unknown; include?: unknown; where: { id: { in: string[] } } }) => {
                if (args.select) {
                    return [
                        countRow("lead-1"),
                        countRow("lead-2", { _count: { orders: 3, portalUsers: 0, businessRequests: 0, visits: 0, assignedProducts: 0, specialVariantPrices: 0 } }),
                        countRow("cari-1", { status: "CUSTOMER" }),
                    ].filter((row) => args.where.id.in.includes(row.id))
                }
                return args.where.id.in.map((id) => auditRow({ id, companyName: `Firma ${id}` }))
            })
        })

        it("yalnız silinebilenleri siler ve her biri için kaskad bilgisiyle DELETE kaydı yazar", async () => {
            const plan = await customerRepository().deleteLeadCustomers(["lead-1", "lead-2", "cari-1"], audit)

            expect(plan.deletableIds).toEqual(["lead-1"])
            expect(plan.blocked.map((item) => item.id).sort()).toEqual(["cari-1", "lead-2"])
            expect(tx.customer.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ["lead-1"] } } })

            const entries = tx.auditLog.createMany.mock.calls[0][0].data
            expect(entries).toHaveLength(1)
            expect(entries[0]).toMatchObject({
                entityId: "lead-1",
                entityLabel: "Firma lead-1",
                action: "DELETE",
                metadata: { cascade: { visitCount: 2, assignedProductCount: 0, specialPriceCount: 1 } },
            })
            expect(firstCallOrder(tx.$queryRaw)).toBeLessThan(firstCallOrder(tx.customer.deleteMany))
        })

        it("bulunamayan id varsa 404; hiçbir şey silinmez", async () => {
            await expect(customerRepository().deleteLeadCustomers(["lead-1", "yok"], audit))
                .rejects.toMatchObject({ statusCode: 404 })
            expect(tx.customer.deleteMany).not.toHaveBeenCalled()
            expect(tx.auditLog.createMany).not.toHaveBeenCalled()
        })
    })

    it("applyCustomerUpdateInTransaction çağıranın transaction'ını ve iş talebi bağlamını kullanır", async () => {
        tx.customer.findMany
            .mockResolvedValueOnce([auditRow()])
            .mockResolvedValueOnce([auditRow({ companyName: "Acme Plastik A.Ş." })])

        await applyCustomerUpdateInTransaction(tx as never, "customer-1", { companyName: "Acme Plastik A.Ş." }, audit, {
            businessRequestId: "request-1",
        })

        expect(prismaMock.$transaction).not.toHaveBeenCalled()
        expect(tx.auditLog.create.mock.calls[0][0].data).toMatchObject({
            changes: [{ field: "companyName", before: "Acme Plastik", after: "Acme Plastik A.Ş." }],
            metadata: { businessRequestId: "request-1" },
        })
    })

    it("replaceSalesUserCustomersInTransaction yalnız temsilcisi gerçekten değişen müşteriler için kayıt yazar", async () => {
        const mehmet = { firstName: "Mehmet", lastName: "Kaya", identifier: null, email: "mehmet@ceyhunlar.com" }
        tx.customer.findMany.mockResolvedValue([
            { id: "c-eski", companyName: "Eski Müşteri", fullName: null, phone: "1", assignedSalesUser: mehmet },
            { id: "c-kalan", companyName: "Kalan Müşteri", fullName: null, phone: "2", assignedSalesUser: mehmet },
            { id: "c-yeni", companyName: "Yeni Müşteri", fullName: null, phone: "3", assignedSalesUser: null },
        ])
        tx.user.findUnique.mockResolvedValue(mehmet)

        await replaceSalesUserCustomersInTransaction(tx as never, "sales-1", ["c-kalan", "c-yeni"], audit)

        expect(tx.customer.updateMany).toHaveBeenNthCalledWith(1, {
            where: { assignedSalesUserId: "sales-1" },
            data: { assignedSalesUserId: null },
        })
        expect(tx.customer.updateMany).toHaveBeenNthCalledWith(2, {
            where: { id: { in: ["c-kalan", "c-yeni"] } },
            data: { assignedSalesUserId: "sales-1" },
        })
        const entries = tx.auditLog.createMany.mock.calls[0][0].data
        expect(entries.map((entry: { entityId: string }) => entry.entityId)).toEqual(["c-eski", "c-yeni"])
        expect(entries[0].changes).toEqual([
            { field: "assignedSalesUser", before: "Mehmet Kaya (mehmet@ceyhunlar.com)", after: null },
        ])
        expect(entries[1].changes).toEqual([
            { field: "assignedSalesUser", before: null, after: "Mehmet Kaya (mehmet@ceyhunlar.com)" },
        ])
    })
})
