import { describe, expect, it } from "vitest"

import { realtimeSessionSeconds, realtimeSubscriptions } from "./realtimeAccess"

const env = {
    USER_ACCESS_REALTIME_TOPIC_PREFIX: "app/kubi/users",
    USER_NOTIFICATION_REALTIME_TOPIC_PREFIX: "app/kubi/notifications/users",
    PRODUCTION_REALTIME_TOPIC: "app/kubi/production/changes",
}
const user = { id: "u-1", isActive: true, accessStatus: "ACTIVE", groups: ["production_planner"] }

describe("realtimeSubscriptions", () => {
    it("üretim konusu yalnız ACTIVE ve üretim yetkili gruba", () => {
        expect(realtimeSubscriptions({ sub: "s-1", user, env })).toEqual([
            "app/kubi/users/s-1/access",
            "app/kubi/notifications/users/u-1",
            "app/kubi/production/changes",
        ])
        expect(realtimeSubscriptions({ sub: "s-1", user: { ...user, groups: ["admin"] }, env })).toContain("app/kubi/production/changes")
        expect(realtimeSubscriptions({ sub: "s-1", user: { ...user, groups: ["sales"] }, env })).not.toContain("app/kubi/production/changes")
        // Onay bekleyen kullanıcı kendi konularını alır (erişim kararı canlı gelir), üretimi almaz.
        expect(realtimeSubscriptions({ sub: "s-1", user: { ...user, accessStatus: "PENDING_REVIEW" }, env })).toEqual([
            "app/kubi/users/s-1/access",
            "app/kubi/notifications/users/u-1",
        ])
    })

    it("pasif kullanıcı hiçbir konuya abone olamaz; eksik ortam ayarı konuyu düşürür", () => {
        expect(realtimeSubscriptions({ sub: "s-1", user: { ...user, isActive: false }, env })).toEqual([])
        expect(realtimeSubscriptions({ sub: "s-1", user, env: { PRODUCTION_REALTIME_TOPIC: "app/kubi/production/changes" } })).toEqual(["app/kubi/production/changes"])
    })
})

describe("realtimeSessionSeconds", () => {
    it("jeton süresi dolunca kesilir; IoT aralığına (300–86.400 sn) kıstırılır", () => {
        expect(realtimeSessionSeconds(10_000 + 3_600, 10_000)).toBe(3_600)
        expect(realtimeSessionSeconds(10_000 + 30, 10_000)).toBe(300)
        expect(realtimeSessionSeconds(10_000 + 200_000, 10_000)).toBe(86_400)
        expect(realtimeSessionSeconds(undefined, 10_000)).toBe(86_400)
    })
})
