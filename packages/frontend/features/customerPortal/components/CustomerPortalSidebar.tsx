"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, Boxes, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
    { href: "/musteri", label: "Genel Bakış", icon: LayoutDashboard },
    { href: "/musteri/tanimli-urunler", label: "Tanımlı Ürünler", icon: Boxes },
    { href: "/musteri/profil", label: "Profil / Firma Bilgileri", icon: Building2 },
]

export function CustomerPortalSidebar() {
    const pathname = usePathname()

    return (
        <aside className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="mb-4 text-sm font-semibold text-neutral-900">Müşteri Paneli</div>
            <nav className="space-y-2">
                {items.map((item) => {
                    const active = item.href === "/musteri" ? pathname === item.href : pathname.startsWith(item.href)
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                                active
                                    ? "bg-brand text-white shadow-sm"
                                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}
