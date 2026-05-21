"use client"

import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useManagedCustomer } from "@/features/sales/customers/hooks/useManagedCustomer"

type Props = {
    customerId: string
}

export function SalesCustomerOverviewPageClient({ customerId }: Props) {
    const customerQuery = useManagedCustomer(customerId)
    const customer = customerQuery.data

    if (customerQuery.isLoading) {
        return (
            <div className="flex min-h-[220px] items-center justify-center rounded-3xl border bg-white shadow-sm">
                <Spinner className="size-5" />
            </div>
        )
    }

    if (!customer) {
        return <div className="rounded-3xl border bg-white p-8 text-sm text-red-600 shadow-sm">Müşteri bulunamadı.</div>
    }

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="grid gap-6 xl:grid-cols-2">
                    <div className="space-y-4">
                        <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Genel Bilgiler</div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                                <div className="text-xs text-neutral-400">Firma</div>
                                <div className="mt-1 text-sm font-medium text-neutral-900">{customer.companyName || "-"}</div>
                            </div>
                            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                                <div className="text-xs text-neutral-400">Yetkili</div>
                                <div className="mt-1 text-sm font-medium text-neutral-900">{customer.fullName}</div>
                            </div>
                            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                                <div className="text-xs text-neutral-400">E-posta</div>
                                <div className="mt-1 text-sm font-medium text-neutral-900">{customer.email}</div>
                            </div>
                            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                                <div className="text-xs text-neutral-400">Telefon</div>
                                <div className="mt-1 text-sm font-medium text-neutral-900">{customer.phone}</div>
                            </div>
                        </div>
                        {customer.note ? (
                            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                                <div className="text-xs text-neutral-400">Not</div>
                                <div className="mt-1 text-sm leading-6 text-neutral-800">{customer.note}</div>
                            </div>
                        ) : null}
                    </div>

                    <div className="space-y-4">
                        <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Adresler</div>
                        {(customer.addresses?.length ?? 0) > 0 ? (
                            <div className="space-y-3">
                                {customer.addresses?.map((address) => (
                                    <div key={address.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="font-medium text-neutral-900">{address.label}</div>
                                            {address.isPrimary ? <Badge variant="secondary">Birincil</Badge> : null}
                                            {address.isBilling ? <Badge variant="outline">Fatura</Badge> : null}
                                            {address.isShipping ? <Badge variant="outline">Sevkiyat</Badge> : null}
                                        </div>
                                        <div className="mt-2 text-sm text-neutral-700">
                                            {[address.line1, address.line2, address.district, address.city, address.stateRef?.name, address.country]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </div>
                                        <div className="mt-2 space-y-1 text-xs text-neutral-500">
                                            {address.contactName ? <div>İrtibat: {address.contactName}</div> : null}
                                            {address.phone ? <div>Telefon: {address.phone}</div> : null}
                                            {address.email ? <div>E-posta: {address.email}</div> : null}
                                            {address.postalCode ? <div>Posta Kodu: {address.postalCode}</div> : null}
                                            {address.taxOffice ? <div>Vergi Dairesi: {address.taxOffice}</div> : null}
                                            {address.taxNumber ? <div>Vergi Numarası: {address.taxNumber}</div> : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-sm text-neutral-500">
                                Tanımlı adres bulunmuyor.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
