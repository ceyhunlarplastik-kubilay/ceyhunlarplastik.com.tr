"use client"

import Link from "next/link"
import { BookMarked, Building2, MapPin, PackageCheck, UserRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CustomerContactCarousel } from "@/components/ui/customer-contact-carousel"
import { Spinner } from "@/components/ui/spinner"
import { UserContactCard } from "@/components/ui/user-contact-card"
import { usePortalCustomer } from "@/features/customerPortal/hooks/usePortalCustomer"
import {
    CustomerPortalPageHeader,
    CustomerPortalPageHeaderStat,
} from "@/features/customerPortal/components/CustomerPortalPageHeader"
import { buildCustomerContactCards } from "@/lib/customers/contactCards"
import { getUserDisplayName } from "@/lib/users/displayName"

export function CustomerPortalOverviewPageClient() {
    const query = usePortalCustomer()
    const customer = query.data
    const assignedSalesDisplayName = customer?.assignedSalesUser
        ? getUserDisplayName(customer.assignedSalesUser)
        : ""
    const customerContacts = customer ? buildCustomerContactCards(customer).map((contact) => ({
        ...contact,
        description: contact.isPrimary
            ? "Portal girişleri, talep akışı ve ürün iletişimi için kullanılan ana müşteri hesabı."
            : "Portal ve operasyon iletişiminde kullanılacak ek müşteri irtibat kişisi.",
        badge: <Badge variant={contact.isPrimary ? "default" : "secondary"}>{contact.isPrimary ? "Ana Yetkili" : "Portal"}</Badge>,
    })) : []

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
            <CustomerPortalPageHeader
                eyebrow="Müşteri Portalı"
                icon={Building2}
                title={customer.companyName || customer.fullName}
                badge={(
                    <Badge variant={customer.status === "CUSTOMER" ? "default" : "secondary"}>
                        {customer.status === "CUSTOMER" ? "Müşteri" : "Potansiyel"}
                    </Badge>
                )}
                description="İlgili ürünlerinizi, tanımlı ürün portföyünüzü ve Ceyhunlar Plastik iletişim noktalarınızı tek ekrandan görüntüleyebilirsiniz."
                aside={(
                    <div className="grid gap-3 sm:grid-cols-2">
                        <CustomerPortalPageHeaderStat
                            label="İlgili Ürün"
                            value={customer.featuredProducts?.length ?? 0}
                        />
                        <CustomerPortalPageHeaderStat
                            label="Tanımlı Ürün"
                            value={customer.assignedProducts?.length ?? 0}
                        />
                        <CustomerPortalPageHeaderStat
                            label="Adres Kaydı"
                            value={customer.addresses?.length ?? 0}
                        />
                        <CustomerPortalPageHeaderStat
                            label="Temsilci"
                            value={(
                                <div className="line-clamp-2 text-sm font-semibold text-slate-950">
                                    {assignedSalesDisplayName || "Atanmadı"}
                                </div>
                            )}
                        />
                    </div>
                )}
            />

            <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.9fr)]">
                <div className="grid gap-5 xl:grid-cols-2">
                    <CustomerContactCarousel
                        contacts={customerContacts}
                        eyebrow="Portal İletişimi"
                        icon={UserRound}
                    />
                    <UserContactCard
                        eyebrow="Ceyhunlar Yetkilisi"
                        icon={PackageCheck}
                        name={assignedSalesDisplayName}
                        roleLabel="Satış Temsilcisi"
                        subtitle="Atanmış temsilci"
                        description="Teklif, operasyon ve ürün eşleştirmelerinde doğrudan temas kuracağınız Ceyhunlar yetkilisi."
                        email={customer.assignedSalesUser?.email}
                        phone={customer.assignedSalesUser?.phone}
                        imageUrl={customer.assignedSalesUser?.imageUrl}
                        emptyMessage="Henüz atanmış temsilci yok. Atama yapıldığında iletişim bilgileri burada görünecek."
                        badge={<Badge variant="outline">Ceyhunlar</Badge>}
                    />
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
