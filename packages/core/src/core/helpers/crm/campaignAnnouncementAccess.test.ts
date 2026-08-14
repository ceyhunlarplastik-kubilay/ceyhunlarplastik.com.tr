import { describe, expect, it } from "vitest"

import type { IAuthenticatedUser } from "@/core/helpers/utils/api/types"
import {
    canViewCampaignAnnouncement,
    findInaccessibleCustomerIds,
    resolveAnnouncementOwnerFilter,
} from "./campaignAnnouncementAccess"

function user(overrides: Partial<IAuthenticatedUser> = {}): IAuthenticatedUser {
    return {
        id: "rep-1",
        cognitoSub: "sub",
        identifier: "rep",
        email: "rep@x.com",
        groups: [],
        accessStatus: "ACTIVE",
        isOwner: false,
        isAdmin: false,
        isSupplier: false,
        isPurchasing: false,
        isSales: false,
        isSalesDirector: false,
        isCustomer: false,
        ...overrides,
    } as IAuthenticatedUser
}

const salesRep = user({ isSales: true, id: "rep-1" })
const otherRep = user({ isSales: true, id: "rep-2" })
const director = user({ isSalesDirector: true, id: "dir-1" })
const admin = user({ isAdmin: true, id: "admin-1" })

describe("findInaccessibleCustomerIds", () => {
    const customers = [
        { id: "c1", assignedSalesUserId: "rep-1" },
        { id: "c2", assignedSalesUserId: "rep-2" },
        { id: "c3", assignedSalesUserId: null },
    ]

    it("temsilci yalnız kendi müşterilerine duyuru yapabilir", () => {
        expect(findInaccessibleCustomerIds(salesRep, customers).sort()).toEqual(["c2", "c3"])
    })

    it("başka temsilcinin müşterisi reddedilir", () => {
        expect(findInaccessibleCustomerIds(otherRep, customers).sort()).toEqual(["c1", "c3"])
    })

    it("satış müdürü kısıtsızdır", () => {
        expect(findInaccessibleCustomerIds(director, customers)).toEqual([])
    })

    it("admin kısıtsızdır", () => {
        expect(findInaccessibleCustomerIds(admin, customers)).toEqual([])
    })

    it("kendi müşterileriyle sınırlı liste tümüyle geçer", () => {
        expect(findInaccessibleCustomerIds(salesRep, [customers[0]])).toEqual([])
    })
})

describe("canViewCampaignAnnouncement", () => {
    it("temsilci kendi duyurusunu görür", () => {
        expect(canViewCampaignAnnouncement(salesRep, { createdByUserId: "rep-1" })).toBe(true)
    })

    it("temsilci başkasının duyurusunu göremez", () => {
        expect(canViewCampaignAnnouncement(salesRep, { createdByUserId: "rep-2" })).toBe(false)
    })

    it("müdür ve admin her duyuruyu görür", () => {
        expect(canViewCampaignAnnouncement(director, { createdByUserId: "rep-2" })).toBe(true)
        expect(canViewCampaignAnnouncement(admin, { createdByUserId: "rep-2" })).toBe(true)
    })
})

describe("resolveAnnouncementOwnerFilter", () => {
    it("temsilcide kendi kimliğine sabitlenir", () => {
        // İstemci başka temsilciyi sorsa bile kendi kimliği uygulanır.
        expect(resolveAnnouncementOwnerFilter(salesRep, "rep-2")).toBe("rep-1")
    })

    it("müdür istediği temsilciyi filtreleyebilir", () => {
        expect(resolveAnnouncementOwnerFilter(director, "rep-2")).toBe("rep-2")
    })

    it("müdür filtre vermezse tümünü görür", () => {
        expect(resolveAnnouncementOwnerFilter(director)).toBeUndefined()
    })
})
