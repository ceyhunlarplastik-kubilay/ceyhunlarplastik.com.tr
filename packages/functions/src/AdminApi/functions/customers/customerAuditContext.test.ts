import { beforeEach, describe, expect, it, vi } from "vitest"

const buildCustomerUpdateData = vi.hoisted(() => vi.fn())
const resolveCustomerAttributeAssignments = vi.hoisted(() => vi.fn())

// Uçlar veritabanına yalnız sahte repository üzerinden dokunur; modül düzeyindeki istemci yüklenmesin.
vi.mock("@/core/db/prisma", () => ({ prisma: {} }))
vi.mock("@/core/helpers/crm/customerUpdateData", () => ({ buildCustomerUpdateData }))
vi.mock("@/core/helpers/crm/customerAttributes", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@/core/helpers/crm/customerAttributes")>()),
    resolveCustomerAttributeAssignments,
}))
// Yanıt eşlemesi bu testin konusu değil; repository sahtesinin dar dönüşüyle çalışsın.
vi.mock("@/core/helpers/crm/mapCustomerForApi", () => ({ mapCustomerForApi: (customer: unknown) => customer }))

import type { IAuthenticatedUser } from "@/core/helpers/utils/api/types"
import { createCustomerHandler } from "@/functions/PublicApi/functions/customers/handlers/createCustomerHandler"
import { updateCustomerHandler } from "@/functions/AdminApi/functions/customers/handlers/updateCustomerHandler"
import { convertCustomerHandler } from "@/functions/AdminApi/functions/customers/handlers/convertCustomerHandler"
import {
    bulkDeleteLeadCustomersHandler,
    deleteLeadCustomerHandler,
} from "@/functions/AdminApi/functions/leadCustomers/handlers/deleteLeadCustomersHandler"

/**
 * Customer'a yazan uçlar denetim bağlamını İSTEKTEN kurar: personel `event.user`'dan,
 * public form ANONİM (gövdede kimlik ne yazarsa yazsın), toplu silme tek çağrıda.
 */
const user: IAuthenticatedUser = {
    id: "admin-1",
    dbUserId: "admin-1",
    cognitoSub: "sub-admin",
    identifier: "admin",
    firstName: "Kubilay",
    lastName: "Uysal",
    email: "kubilay@ceyhunlar.com",
    groups: ["admin"],
    accessStatus: "ACTIVE",
    isOwner: false,
    isAdmin: true,
    isSupplier: false,
    isPurchasing: false,
    isSales: false,
    isSalesDirector: false,
    isCustomer: false,
    isContentEditor: false,
    isProductionPlanner: false,
}

const trace = (routeKey: string) => ({
    routeKey,
    requestContext: { requestId: "req-1", http: { sourceIp: "203.0.113.7", userAgent: "Mozilla/5.0" } },
})

const customerRepository = {
    getCustomer: vi.fn(),
    createCustomer: vi.fn(),
    updateCustomer: vi.fn(),
    convertCustomer: vi.fn(),
    deleteLeadCustomers: vi.fn(),
}

describe("Customer yazma uçları — denetim bağlamı", () => {
    beforeEach(() => {
        vi.resetAllMocks()
        customerRepository.getCustomer.mockResolvedValue({ id: "customer-1", phone: "555" })
        customerRepository.createCustomer.mockResolvedValue({ id: "customer-1" })
        customerRepository.updateCustomer.mockResolvedValue({ id: "customer-1" })
        customerRepository.convertCustomer.mockResolvedValue({ id: "customer-1" })
        customerRepository.deleteLeadCustomers.mockResolvedValue({ deletableIds: ["customer-1"], blocked: [] })
        buildCustomerUpdateData.mockResolvedValue({ phone: "0555 999 88 77" })
        resolveCustomerAttributeAssignments.mockResolvedValue(null)
    })

    it("public web formu ANONİM aktörle kaydedilir; istek künyesi korunur", async () => {
        await createCustomerHandler({ customerRepository, productAttributeValueRepository: {} } as never)({
            ...trace("POST /customers"),
            body: { fullName: "Ayşe", phone: "555", email: "ayse@acme.com" },
        } as never)

        expect(customerRepository.createCustomer.mock.calls[0][1]).toEqual({
            actor: { type: "ANONYMOUS", name: "Web formu" },
            source: "POST /customers",
            requestId: "req-1",
            ipAddress: "203.0.113.7",
            userAgent: "Mozilla/5.0",
        })
    })

    it("admin güncellemesi alanları ve iletişim kişilerini TEK çağrıda, kullanıcı bağlamıyla yazar", async () => {
        await updateCustomerHandler({ customerRepository, productAttributeValueRepository: {} } as never)({
            ...trace("PUT /customers/{id}"),
            user,
            pathParameters: { id: "customer-1" },
            body: { phone: "0555 999 88 77", companyContactAssignments: [{ companyContactId: "contact-1" }] },
        } as never)

        expect(customerRepository.updateCustomer).toHaveBeenCalledTimes(1)
        const [id, data, audit, options] = customerRepository.updateCustomer.mock.calls[0]
        expect(id).toBe("customer-1")
        expect(data).toEqual({ phone: "0555 999 88 77" })
        expect(audit.actor).toMatchObject({ type: "USER", userId: "admin-1", name: "Kubilay Uysal" })
        expect(audit.source).toBe("PUT /customers/{id}")
        expect(options).toEqual({ companyContactAssignments: [{ companyContactId: "contact-1" }] })
    })

    it("dönüştürme denetim bağlamını taşır", async () => {
        await convertCustomerHandler({ customerRepository } as never)({
            ...trace("POST /customers/{id}/convert"),
            user,
            pathParameters: { id: "customer-1" },
        } as never)

        expect(customerRepository.convertCustomer).toHaveBeenCalledWith(
            "customer-1",
            "admin-1",
            expect.objectContaining({ source: "POST /customers/{id}/convert" }),
        )
    })

    it("tekil ve toplu potansiyel müşteri silmesi repository'ye bağlamla gider", async () => {
        await deleteLeadCustomerHandler({ customerRepository } as never)({
            ...trace("DELETE /lead-customers/{id}"),
            user,
            pathParameters: { id: "customer-1" },
        } as never)
        await bulkDeleteLeadCustomersHandler({ customerRepository } as never)({
            ...trace("POST /lead-customers/bulk-delete"),
            user,
            body: { ids: ["customer-1", "customer-2"] },
        } as never)

        expect(customerRepository.deleteLeadCustomers).toHaveBeenNthCalledWith(
            1,
            ["customer-1"],
            expect.objectContaining({ source: "DELETE /lead-customers/{id}" }),
        )
        expect(customerRepository.deleteLeadCustomers).toHaveBeenNthCalledWith(
            2,
            ["customer-1", "customer-2"],
            expect.objectContaining({ source: "POST /lead-customers/bulk-delete" }),
        )
    })

    it("kimliği doğrulanmamış silme isteği 401; hiçbir şey silinmez", async () => {
        await expect(
            deleteLeadCustomerHandler({ customerRepository } as never)({
                ...trace("DELETE /lead-customers/{id}"),
                pathParameters: { id: "customer-1" },
            } as never),
        ).rejects.toMatchObject({ statusCode: 401 })

        expect(customerRepository.deleteLeadCustomers).not.toHaveBeenCalled()
    })
})
