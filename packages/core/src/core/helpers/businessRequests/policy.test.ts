import { describe, expect, it } from "vitest"
import { HttpError } from "http-errors"

import type { IAuthenticatedUser } from "@/core/helpers/utils/api/types"
import {
    buildApprovalSteps,
    getBusinessRequestDomain,
    getRequesterApprovalRole,
} from "./policy"

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

describe("getRequesterApprovalRole", () => {
    it("maps each single flag to its approval role", () => {
        expect(getRequesterApprovalRole(buildUser({ isOwner: true }))).toBe("OWNER")
        expect(getRequesterApprovalRole(buildUser({ isAdmin: true }))).toBe("ADMIN")
        expect(getRequesterApprovalRole(buildUser({ isSalesDirector: true }))).toBe("SALES_DIRECTOR")
        expect(getRequesterApprovalRole(buildUser({ isSales: true }))).toBe("SALES")
        expect(getRequesterApprovalRole(buildUser({ isPurchasing: true }))).toBe("PURCHASING")
        expect(getRequesterApprovalRole(buildUser({ isSupplier: true }))).toBe("SUPPLIER")
        expect(getRequesterApprovalRole(buildUser({ isCustomer: true }))).toBe("CUSTOMER")
    })

    it("resolves precedence top-down when multiple flags are set", () => {
        expect(
            getRequesterApprovalRole(buildUser({ isOwner: true, isAdmin: true, isSales: true })),
        ).toBe("OWNER")
        expect(
            getRequesterApprovalRole(buildUser({ isSalesDirector: true, isSales: true })),
        ).toBe("SALES_DIRECTOR")
    })

    it("throws 403 Forbidden when no eligible flag is set", () => {
        const attempt = () => getRequesterApprovalRole(buildUser({ isContentEditor: true }))

        expect(attempt).toThrowError(HttpError)
        try {
            attempt()
        } catch (error) {
            expect((error as HttpError).statusCode).toBe(403)
        }
    })
})

describe("getBusinessRequestDomain", () => {
    it("routes customer-facing and offer/payment types to SALES", () => {
        expect(getBusinessRequestDomain("CUSTOMER_PROFILE_CHANGE")).toBe("SALES")
        expect(getBusinessRequestDomain("CUSTOMER_ORDER_REQUEST")).toBe("SALES")
        expect(getBusinessRequestDomain("CUSTOMER_DOCUMENT_REQUEST")).toBe("SALES")
        expect(getBusinessRequestDomain("CUSTOMER_PRICING_REQUEST")).toBe("SALES")
        expect(getBusinessRequestDomain("OFFER_DISCOUNT_REQUEST")).toBe("SALES")
        expect(getBusinessRequestDomain("PAYMENT_TERM_REQUEST")).toBe("SALES")
    })

    it("routes supplier-facing types to PURCHASING", () => {
        expect(getBusinessRequestDomain("SUPPLIER_PROFILE_CHANGE")).toBe("PURCHASING")
        expect(getBusinessRequestDomain("SUPPLIER_PRICING_CHANGE")).toBe("PURCHASING")
        expect(getBusinessRequestDomain("SUPPLIER_CAPABILITY_CHANGE")).toBe("PURCHASING")
        expect(getBusinessRequestDomain("SUPPLIER_CATEGORY_CREATE")).toBe("PURCHASING")
        expect(getBusinessRequestDomain("SUPPLIER_PRODUCT_CREATE")).toBe("PURCHASING")
        expect(getBusinessRequestDomain("SUPPLIER_VARIANT_CREATE")).toBe("PURCHASING")
    })
})

describe("buildApprovalSteps", () => {
    it("builds customer -> sales -> sales_director -> admin chain when a sales user is assigned", () => {
        const steps = buildApprovalSteps({
            domain: "SALES",
            requesterRole: "CUSTOMER",
            customerAssignedSalesUserId: "sales-user-1",
        })

        expect(steps).toEqual([
            { stepOrder: 1, requiredRole: "SALES", assignedUserId: "sales-user-1" },
            { stepOrder: 2, requiredRole: "SALES_DIRECTOR" },
            { stepOrder: 3, requiredRole: "ADMIN" },
        ])
    })

    it("skips the sales step when the customer has no assigned sales user", () => {
        const steps = buildApprovalSteps({
            domain: "SALES",
            requesterRole: "CUSTOMER",
            customerAssignedSalesUserId: null,
        })

        expect(steps).toEqual([
            { stepOrder: 1, requiredRole: "SALES_DIRECTOR" },
            { stepOrder: 2, requiredRole: "ADMIN" },
        ])
    })

    it("sales requester escalates to sales_director then admin", () => {
        expect(
            buildApprovalSteps({ domain: "SALES", requesterRole: "SALES" }),
        ).toEqual([
            { stepOrder: 1, requiredRole: "SALES_DIRECTOR" },
            { stepOrder: 2, requiredRole: "ADMIN" },
        ])
    })

    it("sales_director requester needs only admin approval", () => {
        expect(
            buildApprovalSteps({ domain: "SALES", requesterRole: "SALES_DIRECTOR" }),
        ).toEqual([{ stepOrder: 1, requiredRole: "ADMIN" }])
    })

    it("supplier requester escalates to purchasing then admin", () => {
        expect(
            buildApprovalSteps({ domain: "PURCHASING", requesterRole: "SUPPLIER" }),
        ).toEqual([
            { stepOrder: 1, requiredRole: "PURCHASING" },
            { stepOrder: 2, requiredRole: "ADMIN" },
        ])
    })

    it("purchasing requester needs only admin approval", () => {
        expect(
            buildApprovalSteps({ domain: "PURCHASING", requesterRole: "PURCHASING" }),
        ).toEqual([{ stepOrder: 1, requiredRole: "ADMIN" }])
    })

    it("returns no steps for role/domain combinations outside the matrix", () => {
        // Admin/owner talepleri ve domain-dışı roller zincir üretmez —
        // service katmanı bu durumu ayrıca ele alır; policy sessizce boş döner.
        expect(buildApprovalSteps({ domain: "SALES", requesterRole: "ADMIN" })).toEqual([])
        expect(buildApprovalSteps({ domain: "SALES", requesterRole: "PURCHASING" })).toEqual([])
        expect(buildApprovalSteps({ domain: "PURCHASING", requesterRole: "SALES" })).toEqual([])
        expect(buildApprovalSteps({ domain: "PURCHASING", requesterRole: "CUSTOMER" })).toEqual([])
    })
})
