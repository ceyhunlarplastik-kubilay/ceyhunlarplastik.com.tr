import { describe, expect, it } from "vitest"

import { notificationHref } from "./notificationHref"

describe("bildirim bağlantısı", () => {
    it("yalnız uygulama içi yol", () => {
        expect(notificationHref({ href: "/uretim/tahta?bas=2026-09-28&is=1000" })).toBe("/uretim/tahta?bas=2026-09-28&is=1000")
        expect(notificationHref({ href: "//kotu.example" })).toBeNull()
        expect(notificationHref({ href: "/\\kotu.example" })).toBeNull()
        expect(notificationHref({ href: "https://kotu.example" })).toBeNull()
        expect(notificationHref({ href: 42 })).toBeNull()
        expect(notificationHref(null)).toBeNull()
    })
})
