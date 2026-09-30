import type { PanelNavGroup } from "@/components/panels/types"

/**
 * Üretim planlama (`production_planner`) panelinin navigasyonu.
 *
 * Modüller dilim dilim geliyor (bkz. docs/production-planning.md §10): bir
 * sayfa gerçekten var olmadan menüye EKLENMEZ — aksi hâlde öğe 404'e düşer.
 * Henüz gelmemiş modüller genel bakış sayfasında "yakında" olarak listelenir.
 */
export const productionNavGroups: PanelNavGroup[] = [
    {
        items: [
            { href: "/uretim", label: "Genel Bakış", icon: "dashboard", match: "exact" },
        ],
    },
    {
        label: "Planlama",
        items: [
            { href: "/uretim/tahta", label: "Planlama Tahtası", icon: "gantt" },
            { href: "/uretim/emirler", label: "Üretim Emirleri", icon: "clipboard" },
        ],
    },
    {
        label: "Saha",
        items: [
            { href: "/uretim/pano", label: "Durum Panosu", icon: "kanban" },
            { href: "/uretim/saha", label: "Vardiya Raporu", icon: "clipboard-check" },
            { href: "/uretim/lotlar", label: "Lotlar", icon: "tags" },
            { href: "/uretim/ekip", label: "Vardiya Ekibi", icon: "users" },
        ],
    },
    {
        label: "Analiz",
        items: [
            { href: "/uretim/istatistikler/urunler", label: "Ürün Geçmişi", icon: "history" },
            { href: "/uretim/istatistikler/makineler", label: "Makine Kullanımı ve OEE", icon: "gauge" },
            { href: "/uretim/istatistikler/kaliplar", label: "Kalıp İstatistikleri", icon: "chart" },
        ],
    },
    {
        label: "Tanımlar",
        items: [
            { href: "/uretim/makineler", label: "Makineler", icon: "factory" },
            { href: "/uretim/kaliplar", label: "Kalıplar", icon: "boxes" },
            { href: "/uretim/varyantlar", label: "Üretim Varyantları", icon: "package" },
            { href: "/uretim/uyumluluk", label: "Uyumluluk Matrisi", icon: "grid" },
            { href: "/uretim/alanlar", label: "Parkur ve Alanlar", icon: "warehouse" },
            { href: "/uretim/vardiyalar", label: "Vardiya ve Takvim", icon: "calendar-clock" },
            { href: "/uretim/operatorler", label: "Operatörler", icon: "hard-hat" },
            { href: "/uretim/nedenler", label: "Duruş ve Fire Nedenleri", icon: "list-checks" },
            { href: "/uretim/hammaddeler", label: "Hammadde Bilgisi", icon: "flask" },
        ],
    },
]
