import type { PanelNavGroup } from "@/components/panels/types"

/**
 * Veri girişi (`content_editor`) panelinin navigasyonu. Eskiden
 * `app/(panels)/veri-girisi/layout.tsx` içinde düz bir dizi olarak duruyordu.
 *
 * Bu panel BİLİNÇLİ olarak dar: ticari alan taşıyan hiçbir yüzey yok
 * (bkz. AGENTS.md — `content_editor` ve CRM sınırı).
 */
export const contentEntryNavGroups: PanelNavGroup[] = [
    {
        label: "Katalog",
        items: [
            { href: "/veri-girisi/categories", label: "Kategoriler", icon: "boxes" },
            { href: "/veri-girisi/products", label: "Ürünler", icon: "package" },
            { href: "/veri-girisi/productAttributes", label: "Özellikler", icon: "settings" },
        ],
    },
    {
        label: "Endüstriyel Kullanım",
        items: [
            { href: "/veri-girisi/industrial-usage-assignments", label: "Kullanım Alanı Ürün Atamaları", icon: "clipboard" },
            { href: "/veri-girisi/industrial-usage-functions", label: "Kullanım Fonksiyonu Aktarımı", icon: "sheet" },
        ],
    },
    {
        // Varyant sözlükleri: adları ve çevirileri buradan girilir. Eskiden yalnız
        // /admin altındaydılar, dolayısıyla içerik editörü bu üç sözlüğün çevirisini
        // hiç giremiyordu.
        label: "Sözlükler",
        items: [
            { href: "/veri-girisi/colors", label: "Renkler", icon: "palette" },
            { href: "/veri-girisi/materials", label: "Ham Maddeler", icon: "layers" },
            { href: "/veri-girisi/measurement-types", label: "Ölçü Tipleri", icon: "ruler" },
        ],
    },
    {
        label: "Müşteriler",
        items: [
            { href: "/veri-girisi/potansiyel-musteriler", label: "Potansiyel Müşteriler", icon: "users" },
        ],
    },
]
