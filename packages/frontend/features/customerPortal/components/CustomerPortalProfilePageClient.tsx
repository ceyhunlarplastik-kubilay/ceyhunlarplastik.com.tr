"use client"

import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { usePortalCustomer } from "@/features/customerPortal/hooks/usePortalCustomer"

export function CustomerPortalProfilePageClient() {
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
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Profil / Firma Bilgileri</h1>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Firma</div>
                    <div className="mt-2 text-sm font-medium text-neutral-900">{customer.companyName || "-"}</div>
                </div>
                <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Yetkili Kişi</div>
                    <div className="mt-2 text-sm font-medium text-neutral-900">{customer.fullName}</div>
                </div>
                <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">E-posta</div>
                    <div className="mt-2 text-sm font-medium text-neutral-900">{customer.email}</div>
                </div>
                <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Telefon</div>
                    <div className="mt-2 text-sm font-medium text-neutral-900">{customer.phone}</div>
                </div>
                <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Sektör</div>
                    <div className="mt-2 text-sm font-medium text-neutral-900">{customer.sectorValue?.name ?? "-"}</div>
                </div>
                <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Üretim Grubu</div>
                    <div className="mt-2 text-sm font-medium text-neutral-900">{customer.productionGroupValue?.name ?? "-"}</div>
                </div>
            </div>

            {(customer.usageAreaValues?.length ?? 0) > 0 ? (
                <div className="mt-6">
                    <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Kullanım Alanları</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {customer.usageAreaValues?.map((value) => (
                            <Badge key={value.id} variant="secondary">
                                {value.name}
                            </Badge>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    )
}
