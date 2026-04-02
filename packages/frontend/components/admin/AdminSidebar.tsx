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
    Menu,
    ChevronLeft,
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
                                <NavItem
                                    key={item.href}
                                    {...item}
                                    collapsed={false}
                                />
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
                        <NavItem
                            key={item.href}
                            {...item}
                            collapsed={collapsed}
                        />
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