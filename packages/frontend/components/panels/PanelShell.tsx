"use client"

import { usePathname } from "next/navigation"
import { PanelLeft } from "lucide-react"

import { AdminUserMenu } from "@/components/admin/AdminUserMenu"
import { PanelSidebar } from "@/components/panels/PanelSidebar"
import { resolveActivePanelNavLabel } from "@/components/panels/panelNavigationState"
import { PANEL_SIDEBAR_WIDTH } from "@/components/panels/panelSidebarConfig"
import type { PanelNavGroup, PanelUser } from "@/components/panels/types"
import { Button } from "@/components/ui/button"
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
// TooltipProvider AYRICA sarılmıyor: `SidebarProvider` kendi içinde zaten bir
// tane kuruyor ve panelin bütün tooltip'leri onun altında kalıyor.
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/**
 * shadcn'in nötr `--sidebar-*` token'ları panelin mevcut görünümüne çekiliyor:
 * saf beyaz zemin, neutral-200 kenarlık. Aktif hap markadır ama o `PanelSidebar`
 * içinde ayrıca eziliyor — `--sidebar-accent` hover'da da kullanıldığı için
 * token'ı markaya çevirmek hover'ı da boyardı.
 */
const PANEL_SIDEBAR_STYLE = {
    "--sidebar": "#ffffff",
    "--sidebar-border": "var(--color-neutral-200)",
    "--sidebar-width": PANEL_SIDEBAR_WIDTH,
} as React.CSSProperties

/** Panellerin ortak içerik dolgusu. `contentClassName` ile tamamen değiştirilebilir. */
const DEFAULT_CONTENT_CLASS = "p-4 sm:p-5 md:p-8"

type Props = {
    title: string
    subtitle: string
    navGroups: PanelNavGroup[]
    user: PanelUser
    /** Masaüstü topbar'ının sağ tarafı (ör. bildirim zili). */
    actionSlot?: React.ReactNode
    /** Mobil üst çubuğun sağ tarafı. */
    mobileActionSlot?: React.ReactNode
    /** Sidebar'ın altına eklenen panel-özel içerik. */
    sidebarFooterSlot?: React.ReactNode
    /**
     * `main` öğesinin dolgu sınıfları. Verilirse varsayılanın YERİNE geçer
     * (üstüne eklenmez): müşteri portalı kendi dikey ritmine ve mobil sepet
     * çubuğu için alt boşluğa ihtiyaç duyuyor, iki sınıf setini üst üste
     * bindirmek çözülmesi zor bir kural yığını üretirdi.
     */
    contentClassName?: string
    children: React.ReactNode
}

/**
 * Masaüstü üst çubuğu. Sidebar gizliyken onu geri açmanın klavyeden bağımsız
 * yolu buradaki tetikleyicidir: kullanıcı `⌘B`'yi bilmek zorunda değil.
 */
function PanelTopbar({
    title,
    subtitle,
    user,
    actionSlot,
}: Pick<Props, "title" | "subtitle" | "user" | "actionSlot">) {
    const { state } = useSidebar()

    return (
        <header className="sticky top-0 z-30 hidden border-b border-slate-200/70 bg-white/85 backdrop-blur-xl md:block">
            <div className="flex items-center justify-between gap-4 px-6 py-4 md:px-8">
                <div className="flex min-w-0 items-center gap-3">
                    {state === "collapsed" ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <SidebarTrigger className="size-8 text-neutral-500" />
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Navigasyonu göster · ⌘B</TooltipContent>
                        </Tooltip>
                    ) : null}

                    <div className="min-w-0">
                        <p className="text-[11px] font-medium tracking-[0.24em] text-slate-400 uppercase">
                            {subtitle}
                        </p>
                        <h1 className="truncate text-sm font-semibold text-slate-900 md:text-base">
                            {title}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {actionSlot}
                    <AdminUserMenu
                        name={user.name}
                        email={user.email}
                        image={user.image}
                        groups={user.groups ?? []}
                    />
                </div>
            </div>
        </header>
    )
}

/**
 * Mobil üst çubuk. Kalın satırda panel adı DEĞİL, açık olan sayfanın adı yazar:
 * dar ekranda sidebar kapalı olduğu için kullanıcının nerede olduğunu gösteren
 * tek işaret bu. (Müşteri portalının eski sidebar'ı bunu yapıyordu; davranış
 * korunup tüm panellere yayıldı.)
 */
function PanelMobileBar({
    title,
    subtitle,
    navGroups,
    user,
    mobileActionSlot,
}: Pick<Props, "title" | "subtitle" | "navGroups" | "user" | "mobileActionSlot">) {
    const { setOpenMobile } = useSidebar()
    const pathname = usePathname()
    const activeLabel = resolveActivePanelNavLabel(navGroups, pathname)

    return (
        <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur-xl md:hidden">
            <div className="flex min-w-0 items-center gap-3">
                <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-9 rounded-xl"
                    onClick={() => setOpenMobile(true)}
                    aria-label="Navigasyonu aç"
                >
                    <PanelLeft className="size-5" />
                </Button>

                <div className="min-w-0 space-y-0.5">
                    <div className="text-[10px] font-medium tracking-[0.22em] text-neutral-400 uppercase">
                        {subtitle}
                    </div>
                    <h2 className="truncate text-sm font-semibold text-neutral-900">
                        {activeLabel ?? title}
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {mobileActionSlot}
                <AdminUserMenu
                    name={user.name}
                    email={user.email}
                    image={user.image}
                    groups={user.groups ?? []}
                />
            </div>
        </div>
    )
}

/**
 * Panellerin (admin, veri girişi, satış, satın alma, tedarikçi, müşteri portalı)
 * ORTAK kabuğu: sidebar + üst çubuk + içerik.
 *
 * Eskiden her panel bu iskeleti kendi layout'unda kuruyordu ve üç ayrı sidebar
 * bileşeni vardı; daraltma, mobil menü ve aktiflik kuralları birbirinden
 * ayrışmıştı. Yeni panel eklemek artık nav verisi yazmaktan ibaret.
 */
export function PanelShell({
    title,
    subtitle,
    navGroups,
    user,
    actionSlot,
    mobileActionSlot,
    sidebarFooterSlot,
    contentClassName,
    children,
}: Props) {
    return (
        <SidebarProvider style={PANEL_SIDEBAR_STYLE}>
            <PanelSidebar
                title={title}
                subtitle={subtitle}
                navGroups={navGroups}
                footerSlot={sidebarFooterSlot}
            />

            <SidebarInset className="min-w-0 bg-neutral-50">
                <PanelMobileBar
                    title={title}
                    subtitle={subtitle}
                    navGroups={navGroups}
                    user={user}
                    mobileActionSlot={mobileActionSlot}
                />

                <PanelTopbar
                    title={title}
                    subtitle={subtitle}
                    user={user}
                    actionSlot={actionSlot}
                />

                <main className={cn("min-w-0 flex-1", contentClassName ?? DEFAULT_CONTENT_CLASS)}>
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
