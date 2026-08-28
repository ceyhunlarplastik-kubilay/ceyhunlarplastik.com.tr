import type { PanelNavGroup } from "@/components/panels/types"

/** Tedarikçi (dış kullanıcı) panelinin navigasyonu. */
export const supplierNavGroups: PanelNavGroup[] = [
    {
        items: [
            { href: "/tedarikci", label: "Bilgiler", icon: "building", match: "exact" },
            { href: "/tedarikci/urunler", label: "Ürünler", icon: "boxes" },
            { href: "/tedarikci/onay-talepleri", label: "Son Onay Talepleri", icon: "shield", match: "exact" },
        ],
    },
]
