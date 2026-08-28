import type { panelNavIcons } from "@/components/panels/panelNavIcons"

/**
 * Panel navigasyonunun VERİ sözleşmesi.
 *
 * İkon adı STRING: nav tanımları sunucu bileşeni olan layout'larda duruyor ve
 * bir React bileşeni (LucideIcon) sunucu → istemci sınırından geçemez. Ad ile
 * taşınıp istemci tarafında `panelNavIcons` üzerinden çözülür.
 */
export type PanelNavIconName = keyof typeof panelNavIcons

export type PanelNavSubItem = {
    href: string
    label: string
}

export type PanelNavItem = {
    href: string
    label: string
    icon: PanelNavIconName
    /**
     * Aktiflik kuralı. Varsayılan "prefix" (alt sayfalarda da aktif kalır);
     * "exact" panel kökü gibi her şeyin altına düşen href'ler için.
     */
    match?: "exact" | "prefix"
    /** Alt menü — açılır kapanır, üst öğe aktifken kendiliğinden açılır. */
    items?: PanelNavSubItem[]
}

export type PanelNavGroup = {
    /** Başlık verilmezse grup ayırıcı olarak davranır (ör. tek başına Dashboard). */
    label?: string
    items: PanelNavItem[]
}

export type PanelUser = {
    name?: string | null
    email?: string | null
    image?: string | null
    groups?: string[]
}
