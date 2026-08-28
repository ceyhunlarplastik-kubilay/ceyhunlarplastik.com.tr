import type { PanelNavGroup } from "@/components/panels/types"

/**
 * Müşteri portalının navigasyonu. Eskiden `CustomerPortalSidebar` bileşeninin
 * içinde düz bir diziydi.
 */
export const customerPortalNavGroups: PanelNavGroup[] = [
    {
        items: [
            { href: "/musteri", label: "Müşteri Profili", icon: "dashboard", match: "exact" },
        ],
    },
    {
        label: "Ürünler",
        items: [
            { href: "/musteri/tanimli-urunler", label: "İlgili Ürün Modelleri", icon: "bookmark" },
            { href: "/musteri/favori-varyantlarim", label: "Favori Varyantlarım", icon: "heart" },
            { href: "/musteri/kampanyali-urunler", label: "Kampanyalı Ürünler", icon: "megaphone" },
            { href: "/musteri/ozel-fiyatli-urunler", label: "Özel Fiyatlı Ürünler ve Talepler", icon: "discount" },
            { href: "/musteri/tum-urunler", label: "Tüm Ürünler", icon: "package-search" },
        ],
    },
    {
        label: "Siparişler",
        items: [
            { href: "/musteri/siparisler", label: "Siparişler ve Talepler", icon: "package-check" },
            { href: "/musteri/talepler", label: "Tüm Talepler", icon: "clipboard" },
        ],
    },
]
