import {
    Boxes,
    CalendarClock,
    CalendarX2,
    ChartColumn,
    ChartGantt,
    ClipboardList,
    ClipboardPen,
    Factory,
    FlaskConical,
    Gauge,
    Grid3x3,
    ListChecks,
    HardHat,
    History,
    Package,
    SquareKanban,
    Tags,
    Users,
    type LucideIcon,
} from "lucide-react"

export type ProductionModule = {
    title: string
    description: string
    icon: LucideIcon
    /** Yol haritasındaki faz — docs/production-planning.md §10. */
    phase: string
    /**
     * Sayfa gerçekten var olduğunda doldurulur; kart o zaman bağlantıya dönüşür.
     * Aynı dilimde `productionNav.ts`'e de menü öğesi eklenir.
     */
    href?: string
}

/** Genel bakış sayfasındaki modül listesi — yol haritasının sırasıyla. */
export const productionModules: ProductionModule[] = [
    {
        title: "Makineler",
        description: "Kapama kuvveti, kolonlar arası mesafe, kalıp kalınlığı aralığı ve parkur yerleşimi.",
        icon: Factory,
        phase: "Faz 1",
        href: "/uretim/makineler",
    },
    {
        title: "Kalıplar",
        description: "Göz sayısı, çevrim süresi ve kalıbın ürettiği ölçüler — farklı ürün modellerinden gözler dahil.",
        icon: Boxes,
        phase: "Faz 1",
        href: "/uretim/kaliplar",
    },
    {
        title: "Uyumluluk Matrisi",
        description: "Hangi kalıp hangi makinede çalışır; her kalıp için en küçük uygun makine önerisi.",
        icon: Grid3x3,
        phase: "Faz 1",
        href: "/uretim/uyumluluk",
    },
    {
        title: "Üretim Varyantları",
        description: "Kendi ürettiğimiz (iç üretim tedarikçisine bağlı) varyantlar ve varyanta özel çevrim süresi.",
        icon: Package,
        phase: "Faz 1",
        href: "/uretim/varyantlar",
    },
    {
        title: "Hammadde Bilgisi",
        description: "Hammaddenin makinede işlenip işlenmediği, kurutma gereksinimi ve çevrime etkisi.",
        icon: FlaskConical,
        phase: "Faz 1",
        href: "/uretim/hammaddeler",
    },
    {
        title: "Vardiya ve Takvim",
        description: "Makinenin günde kaç saat çalıştığı (12 / 16 / 24 saat) ve bayram, toplu izin, ek mesai günleri.",
        icon: CalendarClock,
        phase: "Faz 1",
        href: "/uretim/vardiyalar",
    },
    {
        title: "Makine Duruşları",
        description: "Planlı bakım ve arıza pencereleri — planlama bu aralıklarda makineye iş koymaz.",
        icon: CalendarX2,
        phase: "Faz 1",
        href: "/uretim/makineler#duruslar",
    },
    {
        title: "Operatörler",
        description: "Makine başında çalışan personel; günlük makine × vardiya ataması Vardiya Ekibi sayfasında.",
        icon: HardHat,
        phase: "Faz 1",
        href: "/uretim/operatorler",
    },
    {
        title: "Üretim Emirleri",
        description: "Hangi varyanttan ne kadar, hangi termine kadar üretileceği — yalnız kalıbı olan ölçüler.",
        icon: ClipboardList,
        phase: "Faz 2",
        href: "/uretim/emirler",
    },
    {
        title: "Planlama Tahtası",
        description: "Makine satırlarında vardiya bazlı Gantt: işler, vardiya lotları, bağlama ve duruşlar. Sürükle-bırak sıradaki dilimde.",
        icon: ChartGantt,
        phase: "Faz 3",
        href: "/uretim/tahta",
    },
    {
        title: "Durum Panosu",
        description: "İşleri Planlandı → Sahaya verildi → Bağlanıyor → Üretimde → Tamamlandı akışında kart olarak izleme; tamamlarken sağlam / fire.",
        icon: SquareKanban,
        phase: "Faz 3",
        href: "/uretim/pano",
    },
    {
        title: "Lotlar ve Notlar",
        description: "Vardiya lotları (1000-1, 1000-2…), lot ekibi, planlayıcı / operatör notları ve QR'lı etiket.",
        icon: Tags,
        phase: "Faz 3",
        href: "/uretim/lotlar",
    },
    {
        title: "Vardiya Ekibi",
        description: "Hangi operatör hangi gün, hangi vardiyada, hangi makinede; günden günlere kopyalama.",
        icon: Users,
        phase: "Faz 3",
        href: "/uretim/ekip",
    },
    {
        title: "Vardiya Raporu",
        description: "Vardiya sonunda sağlam / fire, fire nedenleri ve duruşlar; rapor lotu kapatır, sıradaki lot başlar, kalıp sayacı artar.",
        icon: ClipboardPen,
        phase: "Faz 4",
        href: "/uretim/saha",
    },
    {
        title: "Duruş ve Fire Nedenleri",
        description: "Vardiya raporunda seçilen nedenler; duruş kategorisi istatistikte kayıp türünü ayırır.",
        icon: ListChecks,
        phase: "Faz 4",
        href: "/uretim/nedenler",
    },
    {
        title: "Ürün Geçmişi",
        description: "Ürün, ölçü ve versiyon bazında her üretim: makine, kalıp, vardiya, sağlam / fire, plan ↔ gerçek çevrim; Excel'e aktarma.",
        icon: History,
        phase: "Faz 5",
        href: "/uretim/istatistikler/urunler",
    },
    {
        title: "Makine Kullanımı ve OEE",
        description: "Vardiya süresinin nereye gittiği (üretim, duruş, makine duruşu, boş), en çok süre kaybettiren duruş nedenleri, OEE (kullanılabilirlik × performans × kalite); Excel'e aktarma.",
        icon: Gauge,
        phase: "Faz 5",
        href: "/uretim/istatistikler/makineler",
    },
    {
        title: "Kalıp İstatistikleri",
        description: "Baskı sayacı ve bakım, gerçek çevrimin plandan sapması (makine ve renk / hammadde başına); belirgin farkta makine kartına tek tıkla çevrim önerisi; Excel'e aktarma.",
        icon: ChartColumn,
        phase: "Faz 5",
        href: "/uretim/istatistikler/kaliplar",
    },
]
