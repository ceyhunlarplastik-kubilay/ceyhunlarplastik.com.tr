"use client"

import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { usePortalCustomer } from "@/features/customerPortal/hooks/usePortalCustomer"

export function CustomerPortalOverviewPageClient() {
    const query = usePortalCustomer()
    const customer = query.data

    if (query.isLoading) {
        return (
            <div className="flex min-h-[220px] items-center justify-center rounded-3xl border bg-white shadow-sm">
                <Spinner className="size-5" />
            </div>
        )
    }

    if (!customer) {
        return <div className="rounded-3xl border bg-white p-8 text-sm text-red-600 shadow-sm">Müşteri profili bulunamadı.</div>
    }

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-950">
                        {customer.companyName || customer.fullName}
                    </h1>
                    <Badge variant={customer.status === "CUSTOMER" ? "default" : "secondary"}>
                        {customer.status === "CUSTOMER" ? "Müşteri" : "Potansiyel"}
                    </Badge>
                </div>
                <p className="mt-3 text-sm text-neutral-500">
                    Size özel tanımlanan ürünleri ve firma profilinizi bu panelden görüntüleyebilirsiniz.
                </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border bg-white p-5 shadow-sm">
                    <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">İletişim</div>
                    <div className="mt-3 text-sm text-neutral-900">{customer.email}</div>
                    <div className="mt-1 text-sm text-neutral-500">{customer.phone}</div>
                </div>
                <div className="rounded-3xl border bg-white p-5 shadow-sm">
                    <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Sektör</div>
                    <div className="mt-3 text-sm text-neutral-900">{customer.sectorValue?.name ?? "-"}</div>
                </div>
                <div className="rounded-3xl border bg-white p-5 shadow-sm">
                    <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Üretim Grubu</div>
                    <div className="mt-3 text-sm text-neutral-900">{customer.productionGroupValue?.name ?? "-"}</div>
                </div>
            </div>
        </div>
    )
}
