"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronDown, PanelLeftClose } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { panelNavIcons } from "@/components/panels/panelNavIcons"
import { PANEL_SIDEBAR_PEEK_CLOSE_X } from "@/components/panels/panelSidebarConfig"
import type { PanelNavGroup, PanelNavItem } from "@/components/panels/types"
import { cn } from "@/lib/utils"

/** Kapalıyken sol kenardaki yakalama şeridinin genişliği. */
const PEEK_STRIP_CLASS = "w-3"

function isItemActive(item: PanelNavItem, pathname: string) {
    if (item.match === "exact") return pathname === item.href
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

/**
 * Aktif hap MARKA rengiyle boyanır. shadcn'in varsayılanı `--sidebar-accent`
 * (nötr gri) ve o token aynı zamanda hover'da kullanılıyor; token'ı markaya
 * çevirmek hover'ı da marka rengi yapardı. Bu yüzden yalnız aktif durum ezilir.
 */
const ACTIVE_ITEM_CLASS =
    "data-[active=true]:bg-brand data-[active=true]:text-white data-[active=true]:shadow-md " +
    "data-[active=true]:hover:bg-brand data-[active=true]:hover:text-white"

function PanelNavEntry({ item }: { item: PanelNavItem }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { isMobile, setOpenMobile } = useSidebar()
    const Icon = panelNavIcons[item.icon]
    const isActive = isItemActive(item, pathname)
    const [open, setOpen] = useState(isActive)
    const [wasActive, setWasActive] = useState(isActive)

    // Başka bir yoldan bu bölüme girildiğinde alt menü kendiliğinden açılmalı —
    // ama kullanıcının elle kapatması korunmalı. React'in "render sırasında
    // duruma göre ayarla" deseni: efekt kullanmak fazladan bir render turu ve
    // lint hatası ("setState synchronously within an effect") üretirdi.
    if (isActive !== wasActive) {
        setWasActive(isActive)
        if (isActive) setOpen(true)
    }

    const closeOnMobile = () => {
        if (isMobile) setOpenMobile(false)
    }

    if (!item.items || item.items.length === 0) {
        return (
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.label} className={ACTIVE_ITEM_CLASS}>
                    <Link href={item.href} onClick={closeOnMobile}>
                        <Icon />
                        <span>{item.label}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        )
    }

    const currentHref = searchParams.size > 0 ? `${pathname}?${searchParams.toString()}` : pathname

    return (
        <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isActive} tooltip={item.label} className={ACTIVE_ITEM_CLASS}>
                        <Icon />
                        <span>{item.label}</span>
                        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <SidebarMenuSub>
                        {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.href}>
                                <SidebarMenuSubButton asChild isActive={currentHref === subItem.href}>
                                    <Link href={subItem.href} onClick={closeOnMobile}>
                                        <span>{subItem.label}</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    )
}

type Props = {
    title: string
    subtitle: string
    navGroups: PanelNavGroup[]
    /** Sidebar'ın altına eklenen panel-özel içerik (ör. portal takvim kartı). */
    footerSlot?: React.ReactNode
}

/**
 * Tüm panellerin ORTAK sidebar'ı. Eskiden üç ayrı kopya vardı (AdminSidebar,
 * RoleWorkspaceSidebar, CustomerPortalSidebar) ve daraltma/mobil davranışları
 * birbirinden ayrışmıştı.
 *
 * Davranış Claude Desktop'takine benzer:
 *  - `⌘/Ctrl + B` gizler/gösterir (shadcn `SidebarProvider` içinde hazır),
 *  - GİZLİYKEN sol kenardaki ince şeride gelince sidebar İÇERİĞİ İTMEDEN üstte
 *    belirir, imleç uzaklaşınca kaybolur,
 *  - durum cookie'de saklanır, mobilde Sheet olarak açılır.
 *
 * Önizleme (peek) shadcn'de YOK. Yine de `components/ui/sidebar.tsx` dosyasına
 * DOKUNULMADI: `Sidebar` kendi prop'larını fixed konteynere yayıyor, bu yüzden
 * `className` + `data-peek` dışarıdan geçirilerek çözüldü. Böylece ileride
 * `shadcn add sidebar` ile dosya güncellenirse burası bozulmaz.
 */
export function PanelSidebar({ title, subtitle, navGroups, footerSlot }: Props) {
    const { state, isMobile, toggleSidebar } = useSidebar()
    const [peek, setPeek] = useState(false)
    const isCollapsed = state === "collapsed"
    const isPeeking = peek && isCollapsed && !isMobile
    const [wasCollapsed, setWasCollapsed] = useState(isCollapsed)

    // Sidebar tekrar açılırsa önizleme anlamsız kalır. Sıfırlanmazsa ⌘B ile
    // yeniden gizlendiği anda panel kendiliğinden "önizleme" olarak geri gelirdi.
    if (isCollapsed !== wasCollapsed) {
        setWasCollapsed(isCollapsed)
        if (!isCollapsed) setPeek(false)
    }

    useEffect(() => {
        if (!isPeeking) return

        // `mouseleave` yerine global `mousemove`: şerit üzerinden girildiğinde
        // sidebar imlecin ALTINA doğru kayıyor; kullanıcı bu sırada uzaklaşırsa
        // panele hiç girilmediği için `mouseleave` tetiklenmez ve açık kalırdı.
        const handleMouseMove = (event: MouseEvent) => {
            if (event.clientX > PANEL_SIDEBAR_PEEK_CLOSE_X) setPeek(false)
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [isPeeking])

    return (
        <>
            {isCollapsed && !isMobile && !peek ? (
                <div
                    aria-hidden
                    onMouseEnter={() => setPeek(true)}
                    className={cn("fixed inset-y-0 start-0 z-5 hidden md:block", PEEK_STRIP_CLASS)}
                />
            ) : null}

            <Sidebar
                collapsible="offcanvas"
                data-peek={isPeeking ? "true" : undefined}
                // Gizliyken odak sırasında gezinilebilir kalması erişilebilirlik
                // hatasıydı; görünmeyen menü klavyeyle dolaşılabiliyordu.
                //
                // `!isMobile` şart: mobilde `Sidebar` bu prop'ları Sheet'in
                // içeriğine yayıyor ve `state` masaüstü durumundan türediği için
                // masaüstünde gizliyken açılan mobil menü ERİŞİLMEZ olurdu.
                inert={!isMobile && isCollapsed && !isPeeking}
                className={cn(
                    "group-data-[side=left]:border-neutral-200",
                    // Üst çubuk `z-30` ve daraltılmış durumda tüm genişliği
                    // kapsıyor; önizleme z-10'da kalsaydı çubuğun ALTINA kayardı.
                    isPeeking && "start-0! z-40! shadow-2xl",
                )}
            >
                <SidebarHeader className="gap-0 px-3 pt-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-0.5">
                            <div className="text-[11px] font-medium tracking-[0.24em] text-neutral-400 uppercase">
                                {subtitle}
                            </div>
                            <div className="truncate text-lg font-semibold tracking-tight text-neutral-950">
                                {title}
                            </div>
                        </div>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="size-8 shrink-0 text-neutral-500"
                                    onClick={toggleSidebar}
                                    aria-label="Navigasyonu gizle"
                                >
                                    <PanelLeftClose className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Gizle · ⌘B</TooltipContent>
                        </Tooltip>
                    </div>
                </SidebarHeader>

                <SidebarContent className="gap-0 px-1">
                    {navGroups.map((group, index) => (
                        <SidebarGroup key={group.label ?? `group-${index}`} className="py-1.5">
                            {group.label ? (
                                <SidebarGroupLabel className="text-[10px] tracking-[0.18em] text-neutral-400 uppercase">
                                    {group.label}
                                </SidebarGroupLabel>
                            ) : null}

                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {group.items.map((item) => (
                                        <PanelNavEntry key={item.href} item={item} />
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    ))}
                </SidebarContent>

                <SidebarFooter className="gap-3 px-3 pb-4">
                    {footerSlot}
                    <div className="text-[11px] text-neutral-400">Ceyhunlar Workspace</div>
                </SidebarFooter>
            </Sidebar>
        </>
    )
}
