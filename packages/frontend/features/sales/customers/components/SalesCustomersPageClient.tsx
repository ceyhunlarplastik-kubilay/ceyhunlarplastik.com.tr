"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useManagedCustomers } from "@/features/sales/customers/hooks/useManagedCustomers"

export function SalesCustomersPageClient() {
    const [search, setSearch] = useState("")
    const query = useManagedCustomers({
        page: 1,
        limit: 100,
        ...(search.trim() ? { search: search.trim() } : {}),
    })

    const customers = query.data?.data ?? []

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Atanmış Müşteriler</h1>
                <p className="text-sm text-neutral-500">
                    Sorumlu olduğunuz potansiyel ve aktif müşterileri takip edin.
                </p>
            </div>

            <Input
                placeholder="Firma, kişi veya e-posta ara"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            <div className="grid gap-4 lg:grid-cols-2">
                {query.isLoading ? (
                    <div className="flex min-h-[180px] items-center justify-center rounded-3xl border bg-white shadow-sm lg:col-span-2">
                        <Spinner className="size-5" />
                    </div>
                ) : customers.map((customer) => (
                    <div key={customer.id} className="rounded-3xl border bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-lg font-semibold text-neutral-950">{customer.companyName || customer.fullName}</div>
                                <div className="text-sm text-neutral-500">{customer.fullName}</div>
                            </div>
                            <Badge variant={customer.status === "CUSTOMER" ? "default" : "secondary"}>
                                {customer.status === "CUSTOMER" ? "Müşteri" : "Potansiyel"}
                            </Badge>
                        </div>
                        <div className="mt-4 grid gap-2 text-sm text-neutral-600">
                            <div>{customer.email}</div>
                            <div>{customer.phone}</div>
                            <div>Sektör: {customer.sectorValue?.name ?? "-"}</div>
                            <div>Tanımlı Ürün: {customer.featuredProducts?.length ?? 0}</div>
                            <div>Ziyaret: {customer.visits?.length ?? 0}</div>
                        </div>
                    </div>
                ))}
                {!query.isLoading && customers.length === 0 ? (
                    <div className="rounded-3xl border border-dashed bg-white p-8 text-sm text-neutral-500 shadow-sm lg:col-span-2">
                        Size atanmış müşteri bulunmuyor.
                    </div>
                ) : null}
            </div>
        </div>
    )
}
