import { describe, expect, it, vi } from "vitest"
import { HttpError } from "http-errors"

// service.ts modül başında prisma'yı import ediyor; gerçek modül sst Resource'a
// modül scope'unda dokunur ve sst shell dışında (test:ci/CI) patlar. Buradaki saf
// yetki fonksiyonları prisma'ya hiç dokunmadığı için boş mock yeterli.
vi.mock("@/core/db/prisma", () => ({ prisma: {} }))

import type { IAuthenticatedUser } from "@/core/helpers/utils/api/types"
import type {
    BusinessRequestApprovalStepWithRelations,
    BusinessRequestWithRelations,
} from "@/core/helpers/prisma/businessRequests/repository"
import {
    assertAllowedCustomerRequestType,
    assertBusinessRequestViewAccess,
    canDecideBusinessRequest,
    canViewBusinessRequest,
    getCurrentPendingStep,
} from "./service"

function buildUser(flags: Partial<IAuthenticatedUser> = {}): IAuthenticatedUser {
    return {
        id: "user-1",
        cognitoSub: "sub-1",
        identifier: "Test User",
        email: "test@example.com",
        groups: [],
        accessStatus: "ACTIVE",
        isOwner: false,
        isAdmin: false,
        isSupplier: false,
        isPurchasing: false,
        isSales: false,
        isSalesDirector: false,
        isCustomer: false,
        isContentEditor: false,
        ...flags,
    }
}

type RequestOverrides = {
    domain?: "SALES" | "PURCHASING"
    customerId?: string | null
    supplierId?: string | null
    customer?: { assignedSalesUserId?: string | null } | null
    supplier?: { assignedPurchasingSuppliers?: Array<{ id: string }> } | null
    approvalSteps?: Array<{ id?: string; status: string; requiredRole?: string }>
}

// canView/canDecide/getCurrentPendingStep yalnız bu alanları okur; tam
// BusinessRequestWithRelations kurmak yerine dar fixture cast'lenir.
function buildRequest(overrides: RequestOverrides = {}) {
    return {
        id: "req-1",
        domain: "SALES",
        customerId: null,
        supplierId: null,
        customer: null,
        supplier: null,
        approvalSteps: [],
        ...overrides,
    } as unknown as BusinessRequestWithRelations
}

function buildStep(overrides: Partial<{
    id: string
    requiredRole: string
    status: string
    assignedUserId: string | null
    stepOrder: number
}> = {}) {
    return {
        id: "step-1",
        requiredRole: "SALES",
        status: "PENDING",
        assignedUserId: null,
        stepOrder: 1,
        ...overrides,
    } as unknown as BusinessRequestApprovalStepWithRelations
}

describe("getCurrentPendingStep", () => {
    it("returns the first pending step and skips decided ones", () => {
        const request = buildRequest({
            approvalSteps: [
                { id: "s1", status: "APPROVED" },
                { id: "s2", status: "PENDING" },
                { id: "s3", status: "PENDING" },
            ],
        })

        expect(getCurrentPendingStep(request)).toMatchObject({ id: "s2" })
    })

    it("returns null when no step is pending", () => {
        const request = buildRequest({
            approvalSteps: [
                { id: "s1", status: "APPROVED" },
                { id: "s2", status: "REJECTED" },
                { id: "s3", status: "SKIPPED" },
            ],
        })

        expect(getCurrentPendingStep(request)).toBeNull()
    })
})

describe("canViewBusinessRequest", () => {
    it("always allows owner and admin", () => {
        const request = buildRequest({ customerId: "c-1" })

        expect(canViewBusinessRequest(buildUser({ isOwner: true }), request)).toBe(true)
        expect(canViewBusinessRequest(buildUser({ isAdmin: true }), request)).toBe(true)
    })

    it("allows a customer to view only their own request", () => {
        const own = buildRequest({ customerId: "c-1" })
        const foreign = buildRequest({ customerId: "c-2" })
        const customer = buildUser({ isCustomer: true, customerId: "c-1" })

        expect(canViewBusinessRequest(customer, own)).toBe(true)
        expect(canViewBusinessRequest(customer, foreign)).toBe(false)
    })

    it("allows a supplier to view only their own request", () => {
        const own = buildRequest({ domain: "PURCHASING", supplierId: "sup-1" })
        const foreign = buildRequest({ domain: "PURCHASING", supplierId: "sup-2" })
        const supplier = buildUser({ isSupplier: true, supplierId: "sup-1" })

        expect(canViewBusinessRequest(supplier, own)).toBe(true)
        expect(canViewBusinessRequest(supplier, foreign)).toBe(false)
    })

    it("allows sales director on the SALES domain but not on PURCHASING", () => {
        const director = buildUser({ isSalesDirector: true })

        expect(canViewBusinessRequest(director, buildRequest({ domain: "SALES" }))).toBe(true)
        expect(canViewBusinessRequest(director, buildRequest({ domain: "PURCHASING" }))).toBe(false)
    })

    it("gates sales users by the customer's assigned sales user", () => {
        const sales = buildUser({ isSales: true, id: "sales-1" })

        expect(canViewBusinessRequest(sales, buildRequest({
            domain: "SALES",
            customer: { assignedSalesUserId: "sales-1" },
        }))).toBe(true)
        expect(canViewBusinessRequest(sales, buildRequest({
            domain: "SALES",
            customer: { assignedSalesUserId: "sales-2" },
        }))).toBe(false)
        // Atanmış satışçı yoksa tüm satışçılar görebilir
        expect(canViewBusinessRequest(sales, buildRequest({
            domain: "SALES",
            customer: { assignedSalesUserId: null },
        }))).toBe(true)
    })

    it("gates purchasing users by the supplier's assignment list", () => {
        const purchasing = buildUser({ isPurchasing: true, id: "pur-1" })

        expect(canViewBusinessRequest(purchasing, buildRequest({
            domain: "PURCHASING",
            supplier: { assignedPurchasingSuppliers: [{ id: "pur-1" }, { id: "pur-2" }] },
        }))).toBe(true)
        expect(canViewBusinessRequest(purchasing, buildRequest({
            domain: "PURCHASING",
            supplier: { assignedPurchasingSuppliers: [{ id: "pur-2" }] },
        }))).toBe(false)
    })
})

describe("assertBusinessRequestViewAccess", () => {
    it("throws 401 when the user is missing", () => {
        try {
            assertBusinessRequestViewAccess(undefined, buildRequest())
            expect.unreachable("should have thrown")
        } catch (error) {
            expect((error as HttpError).statusCode).toBe(401)
        }
    })

    it("throws 403 when the user cannot view the request", () => {
        const outsider = buildUser({ isCustomer: true, customerId: "c-9" })

        try {
            assertBusinessRequestViewAccess(outsider, buildRequest({ customerId: "c-1" }))
            expect.unreachable("should have thrown")
        } catch (error) {
            expect((error as HttpError).statusCode).toBe(403)
        }
    })
})

describe("canDecideBusinessRequest", () => {
    it("always allows owner and admin on any step", () => {
        const request = buildRequest()
        const adminStep = buildStep({ requiredRole: "ADMIN" })

        expect(canDecideBusinessRequest(buildUser({ isOwner: true }), request, adminStep)).toBe(true)
        expect(canDecideBusinessRequest(buildUser({ isAdmin: true }), request, adminStep)).toBe(true)
    })

    it("lets a customer decide only CUSTOMER steps of their own request", () => {
        const customer = buildUser({ isCustomer: true, customerId: "c-1" })
        const ownRequest = buildRequest({ customerId: "c-1" })

        expect(canDecideBusinessRequest(customer, ownRequest, buildStep({ requiredRole: "CUSTOMER" }))).toBe(true)
        expect(canDecideBusinessRequest(customer, ownRequest, buildStep({ requiredRole: "SALES" }))).toBe(false)
        expect(canDecideBusinessRequest(
            customer,
            buildRequest({ customerId: "c-2" }),
            buildStep({ requiredRole: "CUSTOMER" }),
        )).toBe(false)
    })

    it("lets a sales director decide SALES and SALES_DIRECTOR steps but not ADMIN", () => {
        const director = buildUser({ isSalesDirector: true })
        const request = buildRequest({ domain: "SALES" })

        expect(canDecideBusinessRequest(director, request, buildStep({ requiredRole: "SALES" }))).toBe(true)
        expect(canDecideBusinessRequest(director, request, buildStep({ requiredRole: "SALES_DIRECTOR" }))).toBe(true)
        expect(canDecideBusinessRequest(director, request, buildStep({ requiredRole: "ADMIN" }))).toBe(false)
    })

    it("gates sales users by step assignment and customer assignment", () => {
        const sales = buildUser({ isSales: true, id: "sales-1" })
        const unassignedCustomer = buildRequest({ domain: "SALES", customer: { assignedSalesUserId: null } })
        const assignedToMe = buildRequest({ domain: "SALES", customer: { assignedSalesUserId: "sales-1" } })
        const assignedToOther = buildRequest({ domain: "SALES", customer: { assignedSalesUserId: "sales-2" } })

        expect(canDecideBusinessRequest(sales, unassignedCustomer, buildStep({ requiredRole: "SALES" }))).toBe(true)
        expect(canDecideBusinessRequest(sales, assignedToMe, buildStep({ requiredRole: "SALES", assignedUserId: "sales-1" }))).toBe(true)
        expect(canDecideBusinessRequest(sales, assignedToMe, buildStep({ requiredRole: "SALES", assignedUserId: "sales-2" }))).toBe(false)
        expect(canDecideBusinessRequest(sales, assignedToOther, buildStep({ requiredRole: "SALES" }))).toBe(false)
        expect(canDecideBusinessRequest(sales, assignedToMe, buildStep({ requiredRole: "SALES_DIRECTOR" }))).toBe(false)
    })

    it("gates purchasing users by role, step assignment and supplier assignment list", () => {
        const purchasing = buildUser({ isPurchasing: true, id: "pur-1" })
        const assigned = buildRequest({
            domain: "PURCHASING",
            supplier: { assignedPurchasingSuppliers: [{ id: "pur-1" }] },
        })
        const notAssigned = buildRequest({
            domain: "PURCHASING",
            supplier: { assignedPurchasingSuppliers: [{ id: "pur-2" }] },
        })

        expect(canDecideBusinessRequest(purchasing, assigned, buildStep({ requiredRole: "PURCHASING" }))).toBe(true)
        expect(canDecideBusinessRequest(purchasing, notAssigned, buildStep({ requiredRole: "PURCHASING" }))).toBe(false)
        expect(canDecideBusinessRequest(purchasing, assigned, buildStep({ requiredRole: "PURCHASING", assignedUserId: "pur-2" }))).toBe(false)
        expect(canDecideBusinessRequest(purchasing, assigned, buildStep({ requiredRole: "ADMIN" }))).toBe(false)
    })

    it("denies roles outside their domain", () => {
        const sales = buildUser({ isSales: true, id: "sales-1" })
        const purchasing = buildUser({ isPurchasing: true, id: "pur-1" })

        expect(canDecideBusinessRequest(
            sales,
            buildRequest({ domain: "PURCHASING", supplier: { assignedPurchasingSuppliers: [] } }),
            buildStep({ requiredRole: "SALES" }),
        )).toBe(false)
        expect(canDecideBusinessRequest(
            purchasing,
            buildRequest({ domain: "SALES" }),
            buildStep({ requiredRole: "PURCHASING" }),
        )).toBe(false)
    })
})

describe("assertAllowedCustomerRequestType", () => {
    it("accepts the four customer portal request types", () => {
        expect(() => assertAllowedCustomerRequestType("CUSTOMER_PROFILE_CHANGE")).not.toThrow()
        expect(() => assertAllowedCustomerRequestType("CUSTOMER_ORDER_REQUEST")).not.toThrow()
        expect(() => assertAllowedCustomerRequestType("CUSTOMER_DOCUMENT_REQUEST")).not.toThrow()
        expect(() => assertAllowedCustomerRequestType("CUSTOMER_PRICING_REQUEST")).not.toThrow()
    })

    it("rejects non-portal request types with 400", () => {
        for (const type of ["SUPPLIER_PROFILE_CHANGE", "OFFER_DISCOUNT_REQUEST", "PAYMENT_TERM_REQUEST"] as const) {
            try {
                assertAllowedCustomerRequestType(type)
                expect.unreachable("should have thrown")
            } catch (error) {
                expect((error as HttpError).statusCode).toBe(400)
            }
        }
    })
})
