"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
    Boxes,
    Building2,
    ChevronLeft,
    ClipboardList,
    MapPinned,
    Menu,
    Package,
    Settings,
    ShieldCheck,
    Truck,
    Users,
} from "lucide-react"

import { AdminUserMenu } from "@/components/admin/AdminUserMenu"
import { cn } from "@/lib/utils"

type NavItem = {
    href: string
    label: string
    icon: "users" | "truck" | "boxes" | "building" | "shield" | "clipboard" | "map" | "package" | "settings"
    match?: "exact" | "prefix"
}

const iconMap = {
    users: Users,
    truck: Truck,
    boxes: Boxes,
    building: Building2,
    shield: ShieldCheck,
    clipboard: ClipboardList,
    map: MapPinned,
    package: Package,
    settings: Settings,
} as const

type Props = {
    panelTitle: string
    panelSubtitle?: string
    navItems: NavItem[]
    name?: string | null
    email?: string | null
    image?: string | null
    groups?: string[]
    mobileActionSlot?: React.ReactNode
}

function WorkspaceNavItem({
    item,
    collapsed = false,
    onNavigate,
}: {
    item: NavItem
    collapsed?: boolean
    onNavigate?: () => void
}) {
    const pathname = usePathname()
    const isActive =
        item.match === "prefix"
            ? pathname === item.href || pathname.startsWith(`${item.href}/`)
            : item.href === pathname
    const Icon = iconMap[item.icon]

    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                isActive
                    ? "bg-brand text-white shadow-md"
                    : "text-neutral-600 hover:bg-neutral-100",
            )}
        >
            <Icon className="h-5 w-5 shrink-0" />
            <AnimatePresence initial={false}>
                {!collapsed ? (
                    <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        className="whitespace-nowrap"
                    >
                        {item.label}
                    </motion.span>
                ) : null}
            </AnimatePresence>
        </Link>
    )
}

export function RoleWorkspaceSidebar({
    panelTitle,
    panelSubtitle = "Operasyon",
    navItems,
    name,
    email,
    image,
    groups = [],
    mobileActionSlot,
}: Props) {
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur-xl md:hidden">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-700 shadow-sm"
                        aria-label="Navigasyonu aç"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="min-w-0 space-y-0.5">
                        <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-400">
                            {panelSubtitle}
                        </div>
                        <h2 className="truncate text-sm font-semibold text-neutral-900">{panelTitle}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {mobileActionSlot}
                    <AdminUserMenu
                        name={name}
                        email={email}
                        image={image}
                        groups={groups}
                    />
                </div>
            </div>

            <AnimatePresence>
                {mobileOpen ? (
                    <>
                        <motion.button
                            type="button"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] md:hidden"
                            aria-label="Menüyü kapat"
                        />

                        <motion.aside
                            initial={{ x: -320, opacity: 0.92 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -320, opacity: 0.92 }}
                            transition={{ type: "spring", stiffness: 220, damping: 28 }}
                            className="fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[320px] flex-col border-r border-neutral-200 bg-white p-4 shadow-2xl md:hidden"
                        >
                            <div className="mb-5 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">
                                        {panelSubtitle}
                                    </div>
                                    <div className="text-base font-semibold text-neutral-900">{panelTitle}</div>
                                </div>

                                <button
                                    className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-700 shadow-sm"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                            </div>

                            <nav className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
                                {navItems.map((item) => (
                                    <WorkspaceNavItem
                                        key={item.href}
                                        item={item}
                                        collapsed={false}
                                        onNavigate={() => setMobileOpen(false)}
                                    />
                                ))}
                            </nav>
                        </motion.aside>
                    </>
                ) : null}
            </AnimatePresence>

            <motion.aside
                animate={{ width: collapsed ? 88 : 260 }}
                className="hidden shrink-0 border-r border-white/70 bg-white p-4 shadow-sm md:flex md:flex-col md:gap-6"
            >
                <div className="flex items-start justify-between gap-3 px-2 pt-1">
                    <AnimatePresence initial={false}>
                        {!collapsed ? (
                            <motion.div
                                key="workspace-sidebar-header"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                className="space-y-0.5"
                            >
                                <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-neutral-400">
                                    {panelSubtitle}
                                </div>
                                <div className="text-2xl font-semibold tracking-tight text-neutral-950">
                                    {panelTitle}
                                </div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>

                    <button
                        type="button"
                        onClick={() => setCollapsed((prev) => !prev)}
                        className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-700 shadow-sm"
                        aria-label={collapsed ? "Navigasyonu genişlet" : "Navigasyonu daralt"}
                    >
                        <ChevronLeft className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")} />
                    </button>
                </div>

                <nav className="flex flex-1 flex-col gap-2">
                    {navItems.map((item) => (
                        <WorkspaceNavItem key={item.href} item={item} collapsed={collapsed} />
                    ))}
                </nav>

                <div className="px-2 text-xs text-neutral-400">
                    {!collapsed ? "Ceyhunlar Workspace" : null}
                </div>
            </motion.aside>
        </>
    )
}
