import type { PanelNavGroup } from "@/components/panels/types"

/**
 * Admin panelinin navigasyonu. Eskiden `AdminSidebar` bileşeninin İÇİNDE gömülü
 * düz bir listeydi (20 öğe, gruplama yok); menüye bir madde eklemek bileşeni
 * düzenlemeyi gerektiriyordu.
 *
 * Gruplama tasarım rötuşunun parçası: 20 maddelik düz liste taranabilir değildi.
 */
export const adminNavGroups: PanelNavGroup[] = [
    {
        items: [
            { href: "/admin", label: "Dashboard", icon: "dashboard", match: "exact" },
        ],
    },
    {
        label: "Katalog",
        items: [
            { href: "/admin/categories", label: "Kategoriler", icon: "folder" },
            { href: "/admin/products", label: "Ürünler", icon: "boxes" },
            {
                href: "/admin/productAttributes",
                label: "Özellikler",
                icon: "settings",
                // Taksonomi kırılımları: sözlüğün tamamı tek ekranda, alt maddeler
                // query ile filtreli görünüme atlar.
                items: [
                    { href: "/admin/productAttributes", label: "Tüm Özellikler" },
                    { href: "/admin/productAttributes?code=sector", label: "Sektör" },
                    { href: "/admin/productAttributes?code=production_group", label: "Üretim Grubu" },
                    { href: "/admin/productAttributes?code=usage_area", label: "Endüstriyel Kullanım Alanı" },
                ],
            },
            { href: "/admin/industrial-usage-assignments", label: "Kullanım Alanı Ürün Atamaları", icon: "clipboard" },
        ],
    },
    {
        label: "Sözlükler",
        items: [
            { href: "/admin/colors", label: "Renkler", icon: "palette" },
            { href: "/admin/materials", label: "Ham Maddeler", icon: "flask" },
            { href: "/admin/measurement-types", label: "Ölçü Tipleri", icon: "ruler" },
        ],
    },
    {
        label: "Müşteriler",
        items: [
            { href: "/admin/potansiyel-musteriler", label: "Potansiyel Müşteriler", icon: "users" },
            { href: "/admin/cari-musteriler", label: "Cari Müşteriler", icon: "users" },
            { href: "/admin/musteriler/harita", label: "Müşteri Haritası", icon: "map" },
            { href: "/admin/company-contacts", label: "Departman İletişimleri", icon: "building" },
            { href: "/admin/web-requests", label: "Web Talepleri", icon: "clipboard" },
        ],
    },
    {
        label: "Satış",
        items: [
            { href: "/admin/kampanyalar", label: "Kampanyalar", icon: "megaphone" },
            { href: "/admin/duyurular", label: "Kampanya Duyuruları", icon: "megaphone" },
            { href: "/admin/siparisler", label: "Siparişler", icon: "clipboard" },
        ],
    },
    {
        label: "Tedarik",
        items: [
            { href: "/admin/suppliers", label: "Tedarikçiler", icon: "truck" },
        ],
    },
    {
        label: "Onay Akışları",
        items: [
            { href: "/admin/onaylar", label: "Müşteri / Satış", icon: "clipboard-check" },
            { href: "/admin/supplier-approval-requests", label: "Tedarikçi / Satın Alma", icon: "shield" },
        ],
    },
    {
        label: "Sistem",
        items: [
            { href: "/admin/users", label: "Kullanıcılar", icon: "users" },
        ],
    },
]
