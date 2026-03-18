"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

function NavItem({
    href,
    label,
}: {
    href: string
    label: string
}) {
    const pathname = usePathname()

    const isActive = pathname.startsWith(href)

    return (
        <Link
            href={href}
            className={`px-3 py-2 rounded-lg text-sm transition
                ${isActive
                    ? "bg-black text-white"
                    : "hover:bg-neutral-100 text-neutral-700"
                }`}
        >
            {label}
        </Link>
    )
}

export function AdminSidebar() {
    return (
        <aside className="w-64 bg-white border-r p-4 space-y-4">

            <div className="mb-6">
                <h2 className="text-lg font-bold">
                    Admin Panel
                </h2>
            </div>

            <nav className="flex flex-col gap-2">

                <NavItem href="/admin/products" label="📦 Ürünler" />
                <NavItem href="/admin/categories" label="🗂️ Kategoriler" />
                <NavItem href="/admin/productAttributes" label="⚙️ Özellikler" />

            </nav>
        </aside>
    )
}