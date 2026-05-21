"use client"

import Link from "next/link"
import { BookMarked, Building2, Mail, MapPin, PackageCheck, Phone, UserRound } from "lucide-react"
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
        <div className="space-y-8">
            <div className="rounded-[32px] border bg-white p-6 shadow-sm lg:p-8 2xl:p-10">
                <div className="flex flex-col gap-6 2xl:grid 2xl:grid-cols-[minmax(0,1.35fr)_minmax(420px,0.95fr)] 2xl:items-end">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
                            <Building2 className="h-3.5 w-3.5" />
                            Müşteri Portalı
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-neutral-950">
                                {customer.companyName || customer.fullName}
                            </h1>
                            <Badge variant={customer.status === "CUSTOMER" ? "default" : "secondary"}>
                                {customer.status === "CUSTOMER" ? "Müşteri" : "Potansiyel"}
                            </Badge>
                        </div>
                        <p className="max-w-3xl text-sm leading-6 text-neutral-500">
                            İlgili ürünlerinizi, tanımlı ürün portföyünüzü ve Ceyhunlar Plastik iletişim noktalarınızı tek ekrandan görüntüleyebilirsiniz.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">İlgili Ürün</div>
                            <div className="mt-2 text-2xl font-semibold text-neutral-950">{customer.featuredProducts?.length ?? 0}</div>
                        </div>
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">Tanımlı Ürün</div>
                            <div className="mt-2 text-2xl font-semibold text-neutral-950">{customer.assignedProducts?.length ?? 0}</div>
                        </div>
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">Adres Kaydı</div>
                            <div className="mt-2 text-2xl font-semibold text-neutral-950">{customer.addresses?.length ?? 0}</div>
                        </div>
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">Temsilci</div>
                            <div className="mt-2 line-clamp-2 text-sm font-semibold text-neutral-950">
                                {customer.assignedSalesUser?.identifier ?? "Atanmadı"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.9fr)]">
                <div className="grid gap-5 xl:grid-cols-2">
                    <div className="rounded-3xl border bg-white p-6 shadow-sm">
                        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-400">
                            <UserRound className="h-3.5 w-3.5" />
                            Portal İletişimi
                        </div>
                        <div className="mt-4 space-y-3 text-sm">
                            <div>
                                <div className="font-medium text-neutral-900">{customer.fullName}</div>
                                <div className="mt-1 inline-flex items-center gap-2 text-neutral-500">
                                    <Mail className="h-4 w-4" />
                                    {customer.email}
                                </div>
                            </div>
                            <div className="inline-flex items-center gap-2 text-neutral-500">
                                <Phone className="h-4 w-4" />
                                {customer.phone}
                            </div>
                        </div>
                    </div>
                    <div className="rounded-3xl border bg-white p-6 shadow-sm">
                        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-400">
                            <PackageCheck className="h-3.5 w-3.5" />
                            Ceyhunlar Yetkilisi
                        </div>
                        <div className="mt-4 space-y-2 text-sm">
                            <div className="font-medium text-neutral-900">
                                {customer.assignedSalesUser?.identifier ?? "Henüz atanmış temsilci yok"}
                            </div>
                            {customer.assignedSalesUser?.email ? (
                                <div className="inline-flex items-center gap-2 text-neutral-500">
                                    <Mail className="h-4 w-4" />
                                    {customer.assignedSalesUser.email}
                                </div>
                            ) : (
                                <div className="text-neutral-500">
                                    Atama yapıldığında ilgili temsilci burada görünecek.
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="rounded-3xl border bg-white p-6 shadow-sm">
                        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-400">
                            <BookMarked className="h-3.5 w-3.5" />
                            Sektörel Eşleşme
                        </div>
                        <div className="mt-4 space-y-2 text-sm">
                            <div className="text-neutral-900">Sektör: {customer.sectorValue?.name ?? "-"}</div>
                            <div className="text-neutral-900">Üretim Grubu: {customer.productionGroupValue?.name ?? "-"}</div>
                            <div className="text-neutral-500">
                                {(customer.usageAreaValues?.length ?? 0) > 0
                                    ? customer.usageAreaValues?.map((value) => value.name).join(", ")
                                    : "Kullanım alanı seçilmedi."}
                            </div>
                        </div>
                    </div>
                    <div className="rounded-3xl border bg-white p-6 shadow-sm">
                        <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Firma Özeti</div>
                        <div className="mt-4 space-y-2 text-sm text-neutral-900">
                            <div>Firma: {customer.companyName || "-"}</div>
                            <div>Durum: {customer.status === "CUSTOMER" ? "Müşteri" : "Potansiyel"}</div>
                        </div>
                    </div>
                    <div className="rounded-3xl border bg-white p-6 shadow-sm xl:col-span-2">
                        <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Müşteri Talepleri</div>
                        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-2xl text-sm leading-6 text-neutral-600">
                                Sipariş, fiyat, doküman ve profil değişikliği taleplerinizi artık portal içinden kontrollü onay akışına gönderebilirsiniz.
                            </div>
                            <Link
                                href="/musteri/talepler"
                                className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-900 transition hover:border-neutral-300 hover:bg-white"
                            >
                                Talep Merkezini Aç
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border bg-white p-6 shadow-sm">
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-400">
                        <MapPin className="h-3.5 w-3.5" />
                        Adresler
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-2 2xl:grid-cols-1">
                        {(customer.addresses?.length ?? 0) > 0 ? customer.addresses?.map((address) => (
                            <div key={address.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="font-medium text-neutral-900">{address.label}</div>
                                    {address.isPrimary ? <Badge variant="secondary">Birincil</Badge> : null}
                                    {address.isBilling ? <Badge variant="outline">Fatura</Badge> : null}
                                    {address.isShipping ? <Badge variant="outline">Sevkiyat</Badge> : null}
                                </div>
                                <div className="mt-2 text-sm text-neutral-700">
                                    {[address.line1, address.line2, address.district, address.city, address.country]
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
                        )) : (
                            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-sm text-neutral-500">
                                Henüz tanımlı adres bulunmuyor.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
