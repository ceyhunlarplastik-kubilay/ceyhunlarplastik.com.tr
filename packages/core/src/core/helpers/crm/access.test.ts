import { describe, expect, it } from "vitest"
import { canManageCustomer, canManageCustomerVisit } from "./access"
import type { IAuthenticatedUser } from "@/core/helpers/utils/api/types"

function user(overrides: Partial<IAuthenticatedUser> = {}): IAuthenticatedUser {
    return {
        id: "user-1",
        isOwner: false,
        isAdmin: false,
        isSalesDirector: false,
        isSales: false,
        isCustomer: false,
        isSupplier: false,
        isPurchasing: false,
        isContentEditor: false,
        ...overrides,
    } as IAuthenticatedUser
}

describe("canManageCustomer", () => {
    it("owner/admin/sales_director her müşteriyi yönetebilir", () => {
        expect(canManageCustomer(user({ isOwner: true }), { id: "c1" })).toBe(true)
        expect(canManageCustomer(user({ isAdmin: true }), { id: "c1" })).toBe(true)
        expect(canManageCustomer(user({ isSalesDirector: true }), { id: "c1" })).toBe(true)
    })

    it("sales yalnız KENDİSİNE atanmış müşteriyi yönetebilir", () => {
        const requester = user({ isSales: true, id: "rep-1" })
        expect(canManageCustomer(requester, { id: "c1", assignedSalesUserId: "rep-1" })).toBe(true)
        expect(canManageCustomer(requester, { id: "c1", assignedSalesUserId: "rep-2" })).toBe(false)
        expect(canManageCustomer(requester, { id: "c1", assignedSalesUserId: null })).toBe(false)
    })
})

describe("canManageCustomerVisit", () => {
    it("owner/admin/sales_director için canManageCustomer ile aynı davranır", () => {
        expect(canManageCustomerVisit(user({ isOwner: true }), { id: "c1", status: "CUSTOMER" })).toBe(true)
        expect(canManageCustomerVisit(user({ isSalesDirector: true }), { id: "c1", status: "LEAD" })).toBe(true)
    })

    it("sales kendisine atanmış CUSTOMER'ı yönetebilir (canManageCustomer ile aynı)", () => {
        const requester = user({ isSales: true, id: "rep-1" })
        expect(canManageCustomerVisit(requester, { id: "c1", status: "CUSTOMER", assignedSalesUserId: "rep-1" })).toBe(true)
        expect(canManageCustomerVisit(requester, { id: "c1", status: "CUSTOMER", assignedSalesUserId: "rep-2" })).toBe(false)
    })

    it("sales SAHİPLENİLMEMİŞ bir LEAD için de ziyaret planlayabilir (canManageCustomer'dan FARKI)", () => {
        const requester = user({ isSales: true, id: "rep-1" })
        expect(canManageCustomerVisit(requester, { id: "c1", status: "LEAD", assignedSalesUserId: null })).toBe(true)
        expect(canManageCustomerVisit(requester, { id: "c1", status: "LEAD", assignedSalesUserId: "rep-2" })).toBe(true)
        // Karşılaştırma: aynı kayıt için canManageCustomer FALSE döner — bu genişletme yalnız ziyaretlere özel.
        expect(canManageCustomer(requester, { id: "c1", assignedSalesUserId: "rep-2" })).toBe(false)
    })

    it("sales olmayan (customer/supplier/purchasing) rol LEAD bypass'ından yararlanamaz", () => {
        const requester = user({ isPurchasing: true, id: "rep-1" })
        expect(canManageCustomerVisit(requester, { id: "c1", status: "LEAD" })).toBe(false)
    })
})
