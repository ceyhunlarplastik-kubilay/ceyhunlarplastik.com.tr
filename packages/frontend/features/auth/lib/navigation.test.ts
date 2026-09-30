import { describe, expect, it } from "vitest"

import { canAccessPath, resolveAuthHome } from "./navigation"

describe("resolveAuthHome", () => {
    it("üretim planlayıcısını kendi paneline yönlendirir", () => {
        expect(resolveAuthHome(["production_planner"])).toBe("/uretim")
    })

    it("aktif olmayan hesabı rolüne bakmadan /hesabim'e gönderir", () => {
        expect(resolveAuthHome(["production_planner"], "PENDING_REVIEW")).toBe("/hesabim")
    })

    it("admin/owner üretim grubunda da olsa yönetim paneline gider", () => {
        expect(resolveAuthHome(["admin", "production_planner"])).toBe("/admin")
    })
})

describe("canAccessPath — /uretim", () => {
    it("planlayıcı, admin ve owner girebilir", () => {
        expect(canAccessPath(["production_planner"], "/uretim")).toBe(true)
        expect(canAccessPath(["production_planner"], "/uretim/makineler")).toBe(true)
        expect(canAccessPath(["admin"], "/uretim")).toBe(true)
        expect(canAccessPath(["owner"], "/uretim")).toBe(true)
    })

    it("diğer roller giremez", () => {
        for (const group of ["user", "supplier", "purchasing", "sales", "sales_director", "customer", "content_editor"]) {
            expect(canAccessPath([group], "/uretim")).toBe(false)
        }
    })

    it("planlayıcı diğer panellere giremez", () => {
        expect(canAccessPath(["production_planner"], "/admin")).toBe(false)
        expect(canAccessPath(["production_planner"], "/veri-girisi")).toBe(false)
        expect(canAccessPath(["production_planner"], "/musteri-temsilcisi")).toBe(false)
    })

    it("public 'seri-uretim' sayfası panel kuralına takılmaz", () => {
        expect(canAccessPath([], "/seri-uretim")).toBe(true)
    })
})
