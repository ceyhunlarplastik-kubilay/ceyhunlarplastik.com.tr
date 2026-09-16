"use client"

import Link from "next/link"
import { Mail, Phone } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { resolveCustomerNameParts } from "@core/helpers/crm/customerDisplayName"
import type { AdminCustomer } from "@/features/admin/customers/api/types"

/**
 * "Cari Müşteriler" (satış paneli) kartı — `LeadCustomerCard` ile aynı görsel
 * dil, ama farklı veri şekli (`AdminCustomer`) ve farklı aksiyon kümesi: satış
 * temsilcisi burada profil düzenlemez/silmez, yalnız görür ve tanımlı
 * varyantlara gider (mevcut `/satis/musteriler/{id}/defined-products` rotası).
 */
export function SalesActiveCustomerCard({ customer }: { customer: AdminCustomer }) {
    const nameParts = resolveCustomerNameParts(customer)

    return (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-neutral-950">{nameParts.title}</span>
                        {nameParts.subtitle ? (
                            <span className="text-sm text-neutral-500">{nameParts.subtitle}</span>
                        ) : null}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                        {customer.email ? (
                            <span className="inline-flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                {customer.email}
                            </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {customer.phone}
                        </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {customer.sectorValue ? (
                            <Badge variant="outline" className="rounded-full font-normal">
                                {customer.sectorValue.name}
                            </Badge>
                        ) : null}
                        <Badge variant="secondary" className="rounded-full font-normal">
                            {customer.assignedProducts?.length ?? 0} tanımlı varyant
                        </Badge>
                        <Badge variant="secondary" className="rounded-full font-normal">
                            {customer.visits?.length ?? 0} ziyaret
                        </Badge>
                    </div>
                </div>

                <div className="flex shrink-0 gap-2">
                    <Button asChild size="sm" variant="brand" className="rounded-2xl">
                        <Link href={`/satis/musteriler/${customer.id}/defined-products`}>
                            Tanımlı Varyantlar
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
