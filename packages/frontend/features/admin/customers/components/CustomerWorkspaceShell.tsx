"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, Building2, Boxes, CalendarDays, Mail, Phone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useCustomer } from "@/features/admin/customers/hooks/useCustomer"
import { useManagedCustomer } from "@/features/sales/customers/hooks/useManagedCustomer"

const navItems = [
    { label: "Genel Bilgiler", href: "" },
    { label: "İlgili Ürünler", href: "/products" },
    { label: "Tanımlı Ürünler", href: "/defined-products" },
    { label: "Ziyaretler", href: "/visits" },
]

type Props = {
    customerId: string
    children: React.ReactNode
    scope?: "admin" | "sales" | "portal"
    basePath?: string
}

export function CustomerWorkspaceShell({
    customerId,
    children,
    scope = "admin",
    basePath,
}: Props) {
    const pathname = usePathname()
    const adminCustomerQuery = useCustomer(customerId, scope === "admin")
    const salesCustomerQuery = useManagedCustomer(customerId, scope === "sales")
    const customerQuery = scope === "sales" ? salesCustomerQuery : adminCustomerQuery
    const customer = customerQuery.data
    const rootPath = basePath ?? (scope === "sales" ? `/satis/musteriler/${customerId}` : `/admin/customers/${customerId}`)

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                    <Button asChild variant="ghost" className="w-fit px-0 text-neutral-500 hover:bg-transparent hover:text-neutral-900">
                        <Link href={scope === "sales" ? "/satis" : scope === "portal" ? "/musteri" : "/admin/customers"}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Geri Dön
                        </Link>
                    </Button>

                    {customerQuery.isLoading ? (
                        <div className="inline-flex items-center gap-2 text-sm text-neutral-500">
                            <Spinner className="size-4" />
                            Müşteri yükleniyor...
                        </div>
                    ) : customer ? (
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight text-neutral-950">
                                    {customer.companyName || customer.fullName}
                                </h1>
                                <Badge variant={customer.status === "CUSTOMER" ? "default" : "secondary"}>
                                    {customer.status === "CUSTOMER" ? "Müşteri" : "Potansiyel"}
                                </Badge>
                            </div>

                            <div className="flex flex-wrap gap-3 text-sm text-neutral-500">
                                <span className="inline-flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    {customer.fullName}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {customer.email}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    {customer.phone}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-red-600">Müşteri bulunamadı.</div>
                    )}
                </div>

                {customer ? (
                    <div className="grid min-w-[280px] gap-3 rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:w-[560px] xl:grid-cols-4">
                        <div className="rounded-2xl bg-neutral-50 px-4 py-3">
                            <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Satış Temsilcisi</div>
                            <div className="mt-2 text-sm font-medium text-neutral-900">
                                {customer.assignedSalesUser?.identifier ?? "Atama yok"}
                            </div>
                        </div>
                        <div className="rounded-2xl bg-neutral-50 px-4 py-3">
                            <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">İlgili Ürün</div>
                            <div className="mt-2 text-sm font-medium text-neutral-900">
                                {customer.featuredProducts?.length ?? 0}
                            </div>
                        </div>
                        <div className="rounded-2xl bg-neutral-50 px-4 py-3">
                            <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Tanımlı Ürün</div>
                            <div className="mt-2 text-sm font-medium text-neutral-900">
                                {customer.assignedProducts?.length ?? 0}
                            </div>
                        </div>
                        <div className="rounded-2xl bg-neutral-50 px-4 py-3">
                            <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Ziyaret</div>
                            <div className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-neutral-900">
                                <CalendarDays className="h-4 w-4 text-neutral-500" />
                                {customer.visits?.length ?? 0}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
                <aside className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 text-sm font-semibold text-neutral-900">Müşteri Çalışma Alanı</div>
                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const href = `${rootPath}${item.href}`
                            const active = item.href === "" ? pathname === rootPath : pathname === href

                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                                        active
                                            ? "bg-brand text-white shadow-sm"
                                            : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
                                    )}
                                >
                                    {item.label === "İlgili Ürünler" || item.label === "Tanımlı Ürünler" ? <Boxes className="h-4 w-4" /> : null}
                                    {item.label === "Ziyaretler" ? <CalendarDays className="h-4 w-4" /> : null}
                                    {item.label === "Genel Bilgiler" ? <Building2 className="h-4 w-4" /> : null}
                                    <span>{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>
                </aside>

                <section className="min-w-0">
                    {children}
                </section>
            </div>
        </div>
    )
}
