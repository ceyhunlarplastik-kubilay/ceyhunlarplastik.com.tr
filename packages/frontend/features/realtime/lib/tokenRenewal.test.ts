import { describe, expect, it } from "vitest"

import { isSubscriptionRejected } from "./realtimeConnection"
import { readJwtExpirySeconds, realtimeRenewDelayMs } from "./tokenRenewal"

function jwt(payload: object) {
    const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url")
    return `${encode({ alg: "RS256" })}.${encode(payload)}.imza`
}

describe("jeton yenileme zamanlaması", () => {
    it("exp okunur (base64url, dolgusuz); bozuk jeton null", () => {
        expect(readJwtExpirySeconds(jwt({ sub: "ş-ü", exp: 1_790_000_000 }))).toBe(1_790_000_000)
        expect(readJwtExpirySeconds(jwt({ sub: "x" }))).toBeNull()
        expect(readJwtExpirySeconds("bozuk")).toBeNull()
        expect(readJwtExpirySeconds("a.%%%.c")).toBeNull()
    })

    it("bitişten 2 dk önce yeniden bağlanır; en az 30 sn; jeton okunamazsa 50 dk", () => {
        const now = 1_000_000_000_000
        expect(realtimeRenewDelayMs(now / 1000 + 3_600, now)).toBe(58 * 60_000)
        expect(realtimeRenewDelayMs(now / 1000 + 60, now)).toBe(30_000)
        expect(realtimeRenewDelayMs(now / 1000 - 600, now)).toBe(30_000)
        expect(realtimeRenewDelayMs(null, now)).toBe(50 * 60_000)
    })
})

describe("abonelik reddi", () => {
    it("SUBACK 0x80 ve üstü başarısızlık", () => {
        expect(isSubscriptionRejected([{ qos: 0 }])).toBe(false)
        expect(isSubscriptionRejected([{ qos: 128 }])).toBe(true)
        expect(isSubscriptionRejected([{ qos: 0, reasonCode: 0x87 }])).toBe(true)
        expect(isSubscriptionRejected(undefined)).toBe(false)
    })
})
