import { describe, expect, it } from "vitest"

import type { IAuthenticatedUser } from "@/core/helpers/utils/api/types"

import { buildAuditContextFromEvent } from "./auditContext"

const user: IAuthenticatedUser = {
    id: "user-1",
    dbUserId: "user-1",
    cognitoSub: "sub-1",
    identifier: "kubilay",
    firstName: "Kubilay",
    lastName: "Uysal",
    email: "kubilay@example.com",
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

describe("buildAuditContextFromEvent", () => {
    it("aktörü doğrulanmış kullanıcıdan, künyeyi istekten alır", () => {
        const context = buildAuditContextFromEvent({
            user,
            routeKey: "PUT /categories/{id}",
            requestContext: {
                requestId: "req-1",
                http: { sourceIp: "203.0.113.7", userAgent: "Mozilla/5.0" },
            },
        })

        expect(context).toEqual({
            actor: {
                type: "USER",
                userId: "user-1",
                cognitoSub: "sub-1",
                email: "kubilay@example.com",
                name: "Kubilay Uysal",
                groups: ["admin"],
            },
            source: "PUT /categories/{id}",
            requestId: "req-1",
            ipAddress: "203.0.113.7",
            userAgent: "Mozilla/5.0",
        })
    })

    it("kimliği doğrulanmamış istekte 401 atar — kimliksiz yazma denetlenemez", () => {
        expect(() => buildAuditContextFromEvent({ routeKey: "PUT /categories/{id}" }))
            .toThrowError(expect.objectContaining({ statusCode: 401 }))
    })

    it("grupların kopyasını tutar: kullanıcı nesnesi sonradan değişse de bağlam değişmez", () => {
        const mutableUser = { ...user, groups: ["admin"] }
        const context = buildAuditContextFromEvent({ user: mutableUser })

        mutableUser.groups.push("owner")

        expect(context.actor).toMatchObject({ groups: ["admin"] })
    })

    it("ad yoksa identifier'a düşer; istek künyesi yoksa null / unknown yazar", () => {
        const context = buildAuditContextFromEvent({
            user: { ...user, firstName: null, lastName: null },
        })

        expect(context.actor).toMatchObject({ name: "kubilay" })
        expect(context.source).toBe("unknown")
        expect(context.requestId).toBeNull()
        expect(context.ipAddress).toBeNull()
        expect(context.userAgent).toBeNull()
    })

    it("aşırı uzun user-agent'ı keser", () => {
        const context = buildAuditContextFromEvent({
            user,
            requestContext: { http: { userAgent: "x".repeat(2000) } },
        })

        expect(context.userAgent).toHaveLength(512)
    })
})
