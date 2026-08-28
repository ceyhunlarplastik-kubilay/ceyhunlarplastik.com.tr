import { describe, expect, it } from "vitest"

import { isPanelNavItemActive, resolveActivePanelNavLabel } from "./panelNavigationState"
import type { PanelNavGroup } from "./types"

const navGroups: PanelNavGroup[] = [
    {
        items: [
            { href: "/satis", label: "Atanmış Müşteriler", icon: "users", match: "exact" },
        ],
    },
    {
        label: "Satış",
        items: [
            { href: "/satis/urunler", label: "Ürünler", icon: "boxes" },
            { href: "/satis/siparisler", label: "Siparişler", icon: "clipboard" },
        ],
    },
]

describe("isPanelNavItemActive", () => {
    const item = { href: "/admin/users", label: "Kullanıcılar", icon: "users" } as const

    it("alt sayfalarda aktif kalır", () => {
        expect(isPanelNavItemActive(item, "/admin/users")).toBe(true)
        expect(isPanelNavItemActive(item, "/admin/users/42")).toBe(true)
    })

    it("ön ek komşusunu yanlışlıkla eşleştirmez", () => {
        // Eski davranış (`startsWith` ayırıcısız) burada TRUE dönerdi.
        expect(isPanelNavItemActive(item, "/admin/users-archive")).toBe(false)
    })

    it("exact yalnız tam eşleşmede aktif olur", () => {
        const root = { href: "/satis", label: "Kök", icon: "users", match: "exact" } as const

        expect(isPanelNavItemActive(root, "/satis")).toBe(true)
        expect(isPanelNavItemActive(root, "/satis/urunler")).toBe(false)
    })
})

describe("resolveActivePanelNavLabel", () => {
    it("aktif sayfanın adını döndürür", () => {
        expect(resolveActivePanelNavLabel(navGroups, "/satis/urunler/12")).toBe("Ürünler")
    })

    it("panel kökünde kök maddeyi döndürür", () => {
        expect(resolveActivePanelNavLabel(navGroups, "/satis")).toBe("Atanmış Müşteriler")
    })

    it("eşleşme yoksa null döner", () => {
        expect(resolveActivePanelNavLabel(navGroups, "/satis/harita")).toBeNull()
    })

    it("çakışmada en derin eşleşme kazanır", () => {
        const overlapping: PanelNavGroup[] = [
            {
                items: [
                    { href: "/musteri", label: "Profil", icon: "dashboard" },
                    { href: "/musteri/siparisler", label: "Siparişler", icon: "clipboard" },
                ],
            },
        ]

        expect(resolveActivePanelNavLabel(overlapping, "/musteri/siparisler")).toBe("Siparişler")
    })
})
