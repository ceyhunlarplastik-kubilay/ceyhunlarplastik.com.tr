"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
    BookMarked,
    Boxes,
    Building2,
    ChevronLeft,
    ClipboardList,
    LayoutDashboard,
    Menu,
    PackageSearch,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { AdminUserMenu } from "@/components/admin/AdminUserMenu"
import { cn } from "@/lib/utils"

const items = [
    { href: "/musteri", label: "Genel Bakış", icon: LayoutDashboard },
    { href: "/musteri/tanimli-urunler", label: "İlgili Ürünler", icon: BookMarked },
    { href: "/musteri/musteriye-tanimli-urunler", label: "Tanımlı Ürünler", icon: Boxes },
    { href: "/musteri/tum-urunler", label: "Tüm Ürünler", icon: PackageSearch },
    { href: "/musteri/talepler", label: "Taleplerim", icon: ClipboardList },
    { href: "/musteri/profil", label: "Profil / Firma Bilgileri", icon: Building2 },
]

const quickRequestItems = [
    { href: "/musteri/talepler?composeType=CUSTOMER_PROFILE_CHANGE", label: "Profil" },
    { href: "/musteri/talepler?composeType=CUSTOMER_ORDER_REQUEST&draft=open", label: "Sipariş" },
    { href: "/musteri/talepler?composeType=CUSTOMER_DOCUMENT_REQUEST", label: "Döküman" },
    { href: "/musteri/talepler?composeType=CUSTOMER_PRICING_REQUEST&draft=open", label: "Fiyat" },
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
    const isActive = href === "/musteri" ? pathname === href : pathname.startsWith(href)

    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all",
                isActive
                    ? "bg-brand text-white shadow-md"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            )}
        >
            <Icon className="h-5 w-5 shrink-0" />

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

export function CustomerPortalSidebar({
    name,
    email,
    image,
    groups = [],
}: Props) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const activeItem = useMemo(
        () => items.find((item) => item.href === "/musteri" ? pathname === item.href : pathname.startsWith(item.href)),
        [pathname]
    )

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
                        <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-400">Ceyhunlar</div>
                        <h2 className="truncate text-sm font-semibold text-neutral-900">
                            {activeItem?.label ?? "Müşteri Paneli"}
                        </h2>
                    </div>
                </div>

                <AdminUserMenu
                    name={name}
                    email={email}
                    image={image}
                    groups={groups}
                />
            </div>

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

                        <motion.aside
                            initial={{ x: -320, opacity: 0.92 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -320, opacity: 0.92 }}
                            transition={{ type: "spring", stiffness: 220, damping: 28 }}
                            className="fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[320px] flex-col border-r border-neutral-200 bg-white p-4 shadow-2xl md:hidden"
                        >
                            <div className="mb-5 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">Ceyhunlar</div>
                                    <div className="text-base font-semibold text-neutral-900">Müşteri Menüsü</div>
                                </div>

                                <button
                                    className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-700 shadow-sm"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                            </div>

                            <nav className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
                                {items.map((item) => (
                                    <NavItem
                                        key={item.href}
                                        {...item}
                                        collapsed={false}
                                        onNavigate={() => setMobileOpen(false)}
                                    />
                                ))}
                            </nav>

                            <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                                    Hızlı Talep
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    {quickRequestItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileOpen(false)}
                                            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-100"
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
                                Portal ekranları mobil kullanım için sadeleştirildi ve hızlı erişim odaklı düzenlendi.
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <motion.aside
                animate={{ width: collapsed ? 84 : 280 }}
                className="hidden md:flex md:flex-col md:gap-6 md:border-r md:bg-white md:p-4"
            >
                <div className="flex items-center justify-between">
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-0.5"
                            >
                                <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">Ceyhunlar</div>
                                <div className="text-lg font-semibold text-neutral-900">Müşteri Paneli</div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={() => setCollapsed((value) => !value)}
                        className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-700 transition hover:bg-neutral-50"
                        aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
                    >
                        <ChevronLeft className={cn("transition", collapsed && "rotate-180")} />
                    </button>
                </div>

                <nav className="flex flex-col gap-2">
                    {items.map((item) => (
                        <NavItem
                            key={item.href}
                            {...item}
                            collapsed={collapsed}
                        />
                    ))}
                </nav>

                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                        >
                            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                                Hızlı Talep
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                {quickRequestItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-100"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-auto text-xs text-neutral-400">
                    {!collapsed && "Ceyhunlar Customer Portal"}
                </div>
            </motion.aside>
        </>
    )
}
