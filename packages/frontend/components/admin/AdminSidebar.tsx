"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"

import {
    LayoutDashboard,
    Boxes,
    Folder,
    Settings,
    Truck,
    Users,
    ClipboardList,
    Menu,
    ChevronLeft,
    ChevronDown,
} from "lucide-react"

const navItems = [
    {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
    },
    {
        href: "/admin/products",
        label: "Ürünler",
        icon: Boxes,
    },
    {
        href: "/admin/categories",
        label: "Kategoriler",
        icon: Folder,
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
}: {
    href: string
    label: string
    icon: any
    collapsed: boolean
}) {
    const pathname = usePathname()
    const isActive =
        href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(href)

    return (
        <Link
            href={href}
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

export function AdminSidebar() {
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const pathname = usePathname()
    const [attributesOpen, setAttributesOpen] = useState(pathname.startsWith("/admin/productAttributes"))

    return (
        <>
            {/* MOBILE TOP BAR */}
            <div className="md:hidden flex items-center justify-between p-4 border-b bg-white">
                <h2 className="font-semibold">Admin</h2>
                <button onClick={() => setMobileOpen(true)}>
                    <Menu />
                </button>
            </div>

            {/* MOBILE DRAWER */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl p-4 md:hidden"
                    >
                        <button
                            className="mb-4"
                            onClick={() => setMobileOpen(false)}
                        >
                            <ChevronLeft />
                        </button>

                        <nav className="flex flex-col gap-2">
                            {navItems.map((item) => (
                                <div key={item.href}>
                                    {item.href === "/admin/productAttributes" ? (
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
                                                        className="ml-6 flex flex-col gap-1 overflow-hidden"
                                                    >
                                                        {attributeSubItems.map((subItem) => (
                                                            <Link
                                                                key={subItem.href}
                                                                href={subItem.href}
                                                                onClick={() => setMobileOpen(false)}
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
                                            collapsed={false}
                                        />
                                    )}
                                </div>
                            ))}
                        </nav>
                    </motion.div>
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
