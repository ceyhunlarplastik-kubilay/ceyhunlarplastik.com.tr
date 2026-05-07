"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { AdminUserMenu } from "@/components/admin/AdminUserMenu"

import {
    LayoutDashboard,
    Boxes,
    Folder,
    Settings,
    Truck,
    Users,
    ClipboardList,
    ShieldCheck,
    Menu,
    ChevronLeft,
    ChevronDown,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

const navItems = [
    {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
    },
    {
        href: "/admin/categories",
        label: "Kategoriler",
        icon: Folder,
    },
    {
        href: "/admin/products",
        label: "Ürünler",
        icon: Boxes,
    },
    {
        href: "/admin/productAttributes",
        label: "Özellikler",
        icon: Settings,
    },
    {
        href: "/admin/users",
        label: "Kullanıcılar",
        icon: Users,
    },
    {
        href: "/admin/suppliers",
        label: "Tedarikçiler",
        icon: Truck,
    },
    {
        href: "/admin/customers",
        label: "Müşteriler",
        icon: Users,
    },
    {
        href: "/admin/web-requests",
        label: "Web Talepleri",
        icon: ClipboardList,
    },
    {
        href: "/admin/supplier-approval-requests",
        label: "Onay Bekleyen Talepler",
        icon: ShieldCheck,
    }
]

const attributeSubItems = [
    { href: "/admin/productAttributes", label: "Tüm Özellikler" },
    { href: "/admin/productAttributes?code=sector", label: "Sektör" },
    { href: "/admin/productAttributes?code=production_group", label: "Üretim Grubu" },
    { href: "/admin/productAttributes?code=usage_area", label: "Endüstriyel Kullanım Alanı" },
]

function NavItem({
    href,
    label,
    icon: Icon,
    collapsed,
    onNavigate,
}: {
    href: string
    label: string
    icon: LucideIcon
    collapsed: boolean
    onNavigate?: () => void
}) {
    const pathname = usePathname()
    const isActive =
        href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(href)

    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all",
                isActive
                    ? "bg-brand text-white shadow-md"
                    : "text-neutral-600 hover:bg-neutral-100"
            )}
        >
            <Icon className="w-5 h-5 shrink-0" />

            <AnimatePresence>
                {!collapsed && (
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="whitespace-nowrap"
                    >
                        {label}
                    </motion.span>
                )}
            </AnimatePresence>
        </Link>
    )
}

type Props = {
    name?: string | null
    email?: string | null
    image?: string | null
    groups?: string[]
}

export function AdminSidebar({
    name,
    email,
    image,
    groups = [],
}: Props) {
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const pathname = usePathname()
    const [attributesOpen, setAttributesOpen] = useState(pathname.startsWith("/admin/productAttributes"))

    return (
        <>
            {/* MOBILE TOP BAR */}
            <div className="md:hidden flex items-center justify-between gap-3 border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur-xl">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-700 shadow-sm"
                        aria-label="Navigasyonu aç"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="min-w-0 space-y-0.5">
                        <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-400">Ceyhunlar</div>
                        <h2 className="truncate text-sm font-semibold text-neutral-900">Admin Panel</h2>
                    </div>
                </div>

                <AdminUserMenu
                    name={name}
                    email={email}
                    image={image}
                    groups={groups}
                />
            </div>

            {/* MOBILE DRAWER */}
            <AnimatePresence>
                {mobileOpen && (
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

                        <motion.div
                            initial={{ x: -320, opacity: 0.92 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -320, opacity: 0.92 }}
                            transition={{ type: "spring", stiffness: 220, damping: 28 }}
                            className="fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[320px] flex-col border-r border-neutral-200 bg-white p-4 shadow-2xl md:hidden"
                        >
                            <div className="mb-5 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">Ceyhunlar</div>
                                    <div className="text-base font-semibold text-neutral-900">Admin Menü</div>
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
                                    <div key={item.href}>
                                        {item.href === "/admin/productAttributes" ? (
                                            <div className="space-y-1">
                                                <button
                                                    onClick={() => setAttributesOpen((open) => !open)}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                                                        pathname.startsWith(item.href)
                                                            ? "bg-brand text-white shadow-md"
                                                            : "text-neutral-600 hover:bg-neutral-100"
                                                    )}
                                                >
                                                    <item.icon className="w-5 h-5 shrink-0" />
                                                    <span className="whitespace-nowrap">{item.label}</span>
                                                    <ChevronDown
                                                        className={cn(
                                                            "w-4 h-4 ml-auto transition-transform",
                                                            attributesOpen && "rotate-180"
                                                        )}
                                                    />
                                                </button>

                                                <AnimatePresence>
                                                    {attributesOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="ml-6 flex flex-col gap-1 overflow-hidden border-l border-neutral-200 pl-3"
                                                        >
                                                            {attributeSubItems.map((subItem) => (
                                                                <Link
                                                                    key={subItem.href}
                                                                    href={subItem.href}
                                                                    onClick={() => setMobileOpen(false)}
                                                                    className="rounded-lg px-2 py-2 text-xs text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
                                                                >
                                                                    {subItem.label}
                                                                </Link>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ) : (
                                            <NavItem
                                                {...item}
                                                collapsed={false}
                                                onNavigate={() => setMobileOpen(false)}
                                            />
                                        )}
                                    </div>
                                ))}
                            </nav>

                            <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
                                Operasyon ekranları mobilde hızlı erişim için sadeleştirildi.
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* DESKTOP SIDEBAR */}
            <motion.aside
                animate={{ width: collapsed ? 80 : 260 }}
                className="hidden md:flex flex-col border-r bg-white p-4 gap-6"
            >
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.h2
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="font-bold text-lg"
                            >
                                Admin Panel
                            </motion.h2>
                        )}
                    </AnimatePresence>

                    <button onClick={() => setCollapsed(!collapsed)}>
                        <ChevronLeft
                            className={cn(
                                "transition",
                                collapsed && "rotate-180"
                            )}
                        />
                    </button>
                </div>

                {/* NAV */}
                <nav className="flex flex-col gap-2">
                    {navItems.map((item) => (
                        <div key={item.href}>
                            {item.href === "/admin/productAttributes" && !collapsed ? (
                                <div className="space-y-1">
                                    <button
                                        onClick={() => setAttributesOpen((open) => !open)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all",
                                            pathname.startsWith(item.href)
                                                ? "bg-brand text-white shadow-md"
                                                : "text-neutral-600 hover:bg-neutral-100"
                                        )}
                                    >
                                        <item.icon className="w-5 h-5 shrink-0" />
                                        <span className="whitespace-nowrap">{item.label}</span>
                                        <ChevronDown
                                            className={cn(
                                                "w-4 h-4 ml-auto transition-transform",
                                                attributesOpen && "rotate-180"
                                            )}
                                        />
                                    </button>

                                    <AnimatePresence>
                                        {attributesOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="ml-8 flex flex-col gap-1 overflow-hidden"
                                            >
                                                {attributeSubItems.map((subItem) => (
                                                    <Link
                                                        key={subItem.href}
                                                        href={subItem.href}
                                                        className="text-xs text-neutral-600 hover:text-neutral-900 px-2 py-1 rounded-md hover:bg-neutral-100"
                                                    >
                                                        {subItem.label}
                                                    </Link>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <NavItem
                                    {...item}
                                    collapsed={collapsed}
                                />
                            )}
                        </div>
                    ))}
                </nav>

                {/* FOOTER */}
                <div className="mt-auto text-xs text-neutral-400">
                    {!collapsed && "Ceyhunlar Admin"}
                </div>
            </motion.aside>
        </>
    )
}
