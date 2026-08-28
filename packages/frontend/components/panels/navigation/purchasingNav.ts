import type { PanelNavGroup } from "@/components/panels/types"

/** Satın alma panelinin navigasyonu. */
export const purchasingNavGroups: PanelNavGroup[] = [
    {
        label: "Tedarik",
        items: [
            { href: "/satinalma", label: "Tedarikçiler", icon: "truck", match: "exact" },
            { href: "/satinalma/urunler", label: "Ürünler", icon: "boxes" },
        ],
    },
    {
        label: "Onaylar",
        items: [
            { href: "/satinalma/onaylar", label: "Onay Talepleri", icon: "shield" },
        ],
    },
]
