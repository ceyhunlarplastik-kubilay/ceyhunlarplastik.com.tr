"use client"

import { MapPin } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { CustomerAddress } from "@/features/admin/customers/api/types"

/**
 * Salt-okunur adres listesi — satış temsilcisinin lead/cari müşteri detay
 * accordion'larında (`SalesLeadCustomerDetailPanel`, `SalesActiveCustomerDetailPanel`)
 * kullanılır. Adres CRUD'u BİLEREK yok: ekleme/düzenleme veri girişi panelinin
 * sorumluluğunda kalıyor (kullanıcı talebi).
 */
export function ReadOnlyAddressList({ addresses }: { addresses: CustomerAddress[] }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand" />
                <span className="text-sm font-medium text-neutral-800">Adresler</span>
                <Badge variant="outline" className="rounded-full text-[11px] font-normal">
                    {addresses.length}
                </Badge>
            </div>

            {addresses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-5 text-center text-xs text-neutral-500">
                    Henüz adres eklenmemiş.
                </div>
            ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                    {addresses.map((address) => (
                        <div key={address.id} className="rounded-2xl border border-neutral-200 bg-white p-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-sm font-medium text-neutral-950">{address.label}</span>
                                {address.isPrimary ? (
                                    <Badge
                                        variant="outline"
                                        className="rounded-full border-brand/30 bg-brand/5 text-[10px] font-medium text-brand"
                                    >
                                        birincil
                                    </Badge>
                                ) : null}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs leading-4 text-neutral-600">{address.line1}</p>
                            <p className="mt-0.5 text-[11px] text-neutral-400">
                                {[address.district, address.city, address.stateRef?.name, address.country]
                                    .filter(Boolean)
                                    .join(" / ")}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
