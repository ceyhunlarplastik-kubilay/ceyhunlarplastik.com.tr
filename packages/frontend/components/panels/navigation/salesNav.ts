import type { PanelNavGroup } from "@/components/panels/types"

/**
 * Satış panelinin navigasyonu. Kampanya YÖNETİMİ satış temsilcisine kapalı: uç
 * `sales_director/admin/owner` istiyor, temsilciye gösterilseydi tıklayınca 403
 * alırdı. Temsilci mevcut kampanyayı yalnız kendi müşterilerine duyurabiliyor —
 * "Kampanya Duyuruları" bu yüzden herkeste açık.
 */
export function buildSalesNavGroups(groups: string[]): PanelNavGroup[] {
    const canManageCampaigns =
        groups.includes("sales_director") || groups.includes("admin") || groups.includes("owner")

    return [
        {
            label: "Müşteriler",
            items: [
                { href: "/satis", label: "Atanmış Müşteriler", icon: "users", match: "exact" },
                { href: "/satis/harita", label: "Harita", icon: "map" },
            ],
        },
        {
            label: "Satış",
            items: [
                { href: "/satis/urunler", label: "Ürünler", icon: "boxes" },
                { href: "/satis/siparisler", label: "Siparişler", icon: "clipboard" },
                { href: "/satis/duyurular", label: "Kampanya Duyuruları", icon: "megaphone" },
                ...(canManageCampaigns
                    ? [{ href: "/satis/kampanyalar", label: "Kampanyalar", icon: "megaphone" as const }]
                    : []),
            ],
        },
        {
            label: "Onaylar",
            items: [
                { href: "/satis/onaylar", label: "Onay Talepleri", icon: "shield" },
            ],
        },
    ]
}
