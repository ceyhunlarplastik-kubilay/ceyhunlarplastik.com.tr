"use client"

import Link from "next/link"
import {
    ArrowUpRight,
    Boxes,
    Building2,
    ClipboardList,
    DollarSign,
    PackageCheck,
    PackageSearch,
    Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CustomerContactCarousel } from "@/components/ui/customer-contact-carousel"
import { Spinner } from "@/components/ui/spinner"
import { usePortalCustomerOverview } from "@/features/customerPortal/hooks/usePortalCustomerOverview"
import type { PortalCustomerOverview } from "@/features/customerPortal/api/getPortalCustomerOverview"
import {
    CustomerPortalPageHeader,
    CustomerPortalPageHeaderStat,
} from "@/features/customerPortal/components/CustomerPortalPageHeader"
import { CustomerPortalAddressCarousel } from "@/features/customerPortal/components/CustomerPortalAddressCarousel"
import { CustomerPortalProfileSummaryCard } from "@/features/customerPortal/components/CustomerPortalProfileSummaryCard"
import { CustomerPortalUsersCarousel } from "@/features/customerPortal/components/CustomerPortalUsersCarousel"
import { CustomerPortalUsageAreaCarousel } from "@/features/customerPortal/components/CustomerPortalUsageAreaCarousel"
import { buildCompanyContactCards } from "@/lib/customers/contactCards"
import { getUserDisplayName } from "@/lib/users/displayName"

export function CustomerPortalOverviewPageClient({
    initialOverview,
}: {
    // Dilim 3: RSC'de çekilen slim overview — varsa ilk boya spinner'sız gelir,
    // yoksa (server fetch hatası) hook kendi client fetch'ine düşer.
    initialOverview?: PortalCustomerOverview
}) {
    // Panel ilk-yük pattern'i: overview ürün AĞACI indirmez, sayaçlar API'den gelir.
    const query = usePortalCustomerOverview({ initialData: initialOverview })
    const customer = query.data
    const featuredProductCount = customer?.featuredProductCount ?? customer?.featuredProducts?.length ?? 0
    const assignedProductCount = customer?.assignedProductCount ?? customer?.assignedProducts?.length ?? 0
    const assignedSalesDisplayName = customer?.assignedSalesUser
        ? getUserDisplayName(customer.assignedSalesUser)
        : ""
    const companyContacts = customer ? buildCompanyContactCards(customer).map((contact) => ({
        ...contact,
        /* description: "Ceyhunlar Plastik temsilcisi", */
        badge: <Badge variant="outline">Ceyhunlar</Badge>,
    })) : []
    const ceyhunlarContacts = customer ? [
        ...(customer.assignedSalesUser ? [{
            id: `sales-${customer.assignedSalesUser.id}`,
            name: assignedSalesDisplayName || customer.assignedSalesUser.email,
            roleLabel: "Satış Temsilcisi",
            subtitle: "Atanmış temsilci",
            /* description: "Ceyhunlar yetkilisi.", */
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

    const quickAccessItems = [
        {
            href: "/musteri/siparisler",
            label: "Siparişlerim",
            description: "Geçmiş ve güncel siparişlerinizi takip edin.",
            icon: PackageCheck,
            metric: "Sipariş takibi",
            className: "from-sky-50 via-cyan-50 to-white text-sky-700",
        },
        {
            href: "/musteri/talepler",
            label: "Taleplerim",
            description: "Sipariş, fiyat ve doküman taleplerinizi yönetin.",
            icon: ClipboardList,
            metric: "Talep merkezi",
            className: "from-amber-50 via-orange-50 to-white text-amber-800",
        },
        {
            href: "/musteri/ozel-fiyatli-urunler",
            label: "Özel Fiyatlı Ürünler",
            description: "Belirli koşullar altında sadece size özel fiyatlarımızı inceleyin.",
            icon: DollarSign,
            metric: "Özel Fiyatlar",
            className: "from-violet-50 via-purple-50 to-white text-violet-700",
        },
        {
            href: "/musteri/musteriye-tanimli-urunler",
            label: "Tanımlı Varyantlar",
            description: "Firmanıza özel tanımlanmış ürün varyant portföyü.",
            icon: Boxes,
            metric: `${assignedProductCount} varyant`,
            className: "from-slate-50 via-zinc-50 to-white text-slate-700",
        },
        {
            href: "/musteri/tanimli-urunler",
            label: "İlgili Ürünler",
            description: "Profilinize göre öne çıkan ürünleri inceleyin.",
            icon: Sparkles,
            metric: `${featuredProductCount} ürün`,
            className: "from-emerald-50 via-teal-50 to-white text-emerald-700",
        },
        {
            href: "/musteri/tum-urunler",
            label: "Tüm Ürünler",
            description: "Katalogdaki tüm ürün ve varyantlara ulaşın.",
            icon: PackageSearch,
            metric: "Katalog",
            className: "from-indigo-50 via-blue-50 to-white text-indigo-700",
        },
    ]

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
                description="İlgili ürünlerinizi, tanımlı varyant portföyünüzü ve Ceyhunlar Plastik iletişim noktalarınızı tek ekrandan görüntüleyebilirsiniz."
                aside={(
                    <div className="grid gap-3 sm:grid-cols-2">
                        <CustomerPortalPageHeaderStat
                            label="İlgili Ürün"
                            value={featuredProductCount}
                        />
                        <CustomerPortalPageHeaderStat
                            label="Tanımlı Varyant"
                            value={assignedProductCount}
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
                    <CustomerPortalUsersCarousel customer={customer} />
                    <div className="h-full">
                        {ceyhunlarContacts.length > 0 ? (
                            <CustomerContactCarousel
                                contacts={ceyhunlarContacts}
                                eyebrow="Ceyhunlar Departman İletişimleri"
                                icon={Building2}
                                className="h-full"
                            />
                        ) : (
                            <div className="h-full rounded-3xl border bg-white p-6 shadow-sm">
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
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm xl:col-span-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    Hızlı Erişim
                                </div>
                                <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
                                    Portal Kısayolları
                                </h2>
                            </div>
                            <div className="max-w-xl text-sm leading-6 text-slate-500">
                                Sık kullanılan müşteri portal alanlarına tek dokunuşla ulaşın.
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                            {quickAccessItems.map((item) => {
                                const Icon = item.icon

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="group relative min-h-[154px] overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_36px_-28px_rgba(15,23,42,0.55)]"
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${item.className} opacity-80`} />
                                        <div className="relative flex h-full flex-col justify-between gap-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <span className="rounded-2xl border border-white/80 bg-white/85 p-2.5 shadow-sm">
                                                    <Icon className="h-5 w-5" />
                                                </span>
                                                <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-slate-700" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                    {item.metric}
                                                </div>
                                                <div className="text-base font-semibold tracking-tight text-slate-950">
                                                    {item.label}
                                                </div>
                                                <p className="line-clamp-2 text-xs leading-5 text-slate-600">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <CustomerPortalProfileSummaryCard
                    customer={customer}
                    assignedSalesDisplayName={assignedSalesDisplayName}
                    featuredProductCount={featuredProductCount}
                    assignedProductCount={assignedProductCount}
                />
            </div>
        </div>
    )
}
