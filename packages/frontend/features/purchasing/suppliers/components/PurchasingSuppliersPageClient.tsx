"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useManagedSuppliers } from "@/features/purchasing/suppliers/hooks/useManagedSuppliers"

export function PurchasingSuppliersPageClient() {
    const [search, setSearch] = useState("")
    const query = useManagedSuppliers({
        page: 1,
        limit: 100,
        ...(search.trim() ? { search: search.trim() } : {}),
    })

    const suppliers = query.data?.data ?? []

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Atanmış Tedarikçiler</h1>
                <p className="text-sm text-neutral-500">
                    Satın alma operasyonu için size bağlı tedarikçileri görün ve takip edin.
                </p>
            </div>

            <Input
                placeholder="Tedarikçi adı, yetkili veya vergi no ara"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            <div className="grid gap-4 lg:grid-cols-2">
                {query.isLoading ? (
                    <div className="flex min-h-[180px] items-center justify-center rounded-3xl border bg-white shadow-sm lg:col-span-2">
                        <Spinner className="size-5" />
                    </div>
                ) : suppliers.map((supplier) => (
                    <div key={supplier.id} className="rounded-3xl border bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-lg font-semibold text-neutral-950">{supplier.name}</div>
                                <div className="text-sm text-neutral-500">{supplier.contactName || "Yetkili bilgisi yok"}</div>
                            </div>
                            <Badge variant={supplier.isActive ? "default" : "secondary"}>
                                {supplier.isActive ? "Aktif" : "Pasif"}
                            </Badge>
                        </div>
                        <div className="mt-4 grid gap-2 text-sm text-neutral-600">
                            <div>Telefon: {supplier.phone || "-"}</div>
                            <div>Vergi No: {supplier.taxNumber || "-"}</div>
                            <div>Varsayılan Vade: {supplier.defaultPaymentTermDays ?? "-"} gün</div>
                        </div>
                    </div>
                ))}
                {!query.isLoading && suppliers.length === 0 ? (
                    <div className="rounded-3xl border border-dashed bg-white p-8 text-sm text-neutral-500 shadow-sm lg:col-span-2">
                        Size atanmış tedarikçi bulunmuyor.
                    </div>
                ) : null}
            </div>
        </div>
    )
}
