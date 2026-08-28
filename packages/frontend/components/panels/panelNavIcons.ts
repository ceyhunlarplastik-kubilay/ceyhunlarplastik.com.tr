import {
    BadgePercent,
    BookMarked,
    Boxes,
    Building2,
    ClipboardCheck,
    ClipboardList,
    FileSpreadsheet,
    FlaskConical,
    Folder,
    Heart,
    Layers3,
    LayoutDashboard,
    MapPinned,
    Megaphone,
    Package,
    PackageCheck,
    PackageSearch,
    Palette,
    Ruler,
    Settings,
    ShieldCheck,
    Truck,
    Users,
} from "lucide-react"

/**
 * Panel navigasyonunun ikon sözlüğü. Nav tanımları ada göre seçer; böylece
 * tanımlar saf veri kalır ve sunucu bileşenlerinden istemciye geçebilir.
 *
 * Müşteri portalının ikonları da burada: kalan paneller taşındığında sözlük
 * yeniden bölünmesin.
 */
export const panelNavIcons = {
    dashboard: LayoutDashboard,
    folder: Folder,
    boxes: Boxes,
    package: Package,
    clipboard: ClipboardList,
    "clipboard-check": ClipboardCheck,
    flask: FlaskConical,
    palette: Palette,
    layers: Layers3,
    ruler: Ruler,
    settings: Settings,
    users: Users,
    truck: Truck,
    building: Building2,
    map: MapPinned,
    megaphone: Megaphone,
    shield: ShieldCheck,
    sheet: FileSpreadsheet,
    heart: Heart,
    bookmark: BookMarked,
    discount: BadgePercent,
    "package-search": PackageSearch,
    "package-check": PackageCheck,
} as const
