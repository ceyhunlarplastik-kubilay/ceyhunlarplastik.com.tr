"use client"

import Link from "next/link"
import { Building2, UserRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CustomerContactCarousel } from "@/components/ui/customer-contact-carousel"
import { Spinner } from "@/components/ui/spinner"
import { usePortalCustomer } from "@/features/customerPortal/hooks/usePortalCustomer"
import {
    CustomerPortalPageHeader,
    CustomerPortalPageHeaderStat,
} from "@/features/customerPortal/components/CustomerPortalPageHeader"
import { CustomerPortalAddressCarousel } from "@/features/customerPortal/components/CustomerPortalAddressCarousel"
import { CustomerPortalUsageAreaCarousel } from "@/features/customerPortal/components/CustomerPortalUsageAreaCarousel"
import { buildCompanyContactCards, buildCustomerContactCards } from "@/lib/customers/contactCards"
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
    const companyContacts = customer ? buildCompanyContactCards(customer).map((contact) => ({
        ...contact,
        description: "Ceyhunlar Plastik tarafında bu müşteri için atanmış departman iletişim noktası.",
        badge: <Badge variant="outline">Ceyhunlar</Badge>,
    })) : []
    const ceyhunlarContacts = customer ? [
        ...(customer.assignedSalesUser ? [{
            id: `sales-${customer.assignedSalesUser.id}`,
            name: assignedSalesDisplayName || customer.assignedSalesUser.email,
            roleLabel: "Satış Temsilcisi",
            subtitle: "Atanmış temsilci",
            description: "Teklif, operasyon ve ürün eşleştirmelerinde doğrudan temas kuracağınız Ceyhunlar yetkilisi.",
            email: customer.assignedSalesUser.email,
            phone: customer.assignedSalesUser.phone,
            imageUrl: customer.assignedSalesUser.imageUrl,
            isPrimary: true,
            badge: <Badge variant="outline">Satış Temsilcisi</Badge>,
        }] : []),
        ...companyContacts,
    ] : []

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
                        eyebrow="Müşteri İletişim Kişileri"
                        icon={UserRound}
                    />
                    <div>
                        {ceyhunlarContacts.length > 0 ? (
                            <CustomerContactCarousel
                                contacts={ceyhunlarContacts}
                                eyebrow="Ceyhunlar Departman İletişimleri"
                                icon={Building2}
                            />
                        ) : (
                            <div className="rounded-3xl border bg-white p-6 shadow-sm">
                                <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                                    Ceyhunlar Departman İletişimleri
                                </div>
                                <p className="mt-3 text-sm leading-6 text-neutral-500">
                                    Bu müşteri için henüz muhasebe, depo veya operasyon departman iletişimi atanmamış.
                                    Atama yapıldığında ilgili kişiler burada görünecek.
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <CustomerPortalUsageAreaCarousel customer={customer} />
                    </div>
                    <div className="min-w-0">
                        <CustomerPortalAddressCarousel customer={customer} />
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
                    <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">Portal Özeti</div>
                    <div className="mt-4 space-y-3 text-sm text-neutral-700">
                        <div>Firma: <span className="font-medium text-neutral-950">{customer.companyName || "-"}</span></div>
                        <div>Durum: <span className="font-medium text-neutral-950">{customer.status === "CUSTOMER" ? "Müşteri" : "Potansiyel"}</span></div>
                        <div>Adres: <span className="font-medium text-neutral-950">{customer.addresses?.length ?? 0} kayıt</span></div>
                        <div>Profil eşleşmesi: <span className="font-medium text-neutral-950">{customer.usageAreaValues?.length ?? 0} kullanım alanı</span></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
