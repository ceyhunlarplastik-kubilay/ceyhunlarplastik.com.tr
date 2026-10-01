import { describe, expect, it } from "vitest"

import { canViewAuditLogs } from "./canViewAuditLogs"

describe("canViewAuditLogs", () => {
    it("admin ve owner görebilir", () => {
        expect(canViewAuditLogs(["admin"])).toBe(true)
        expect(canViewAuditLogs(["owner"])).toBe(true)
        expect(canViewAuditLogs(["content_editor", "admin"])).toBe(true)
    })

    it("kaydı düzenleyebilen ama yönetici olmayan roller göremez", () => {
        expect(canViewAuditLogs(["content_editor"])).toBe(false)
        expect(canViewAuditLogs(["sales_director", "purchasing"])).toBe(false)
    })

    it("oturum / grup yoksa göremez", () => {
        expect(canViewAuditLogs(undefined)).toBe(false)
        expect(canViewAuditLogs(null)).toBe(false)
        expect(canViewAuditLogs([])).toBe(false)
    })
})
