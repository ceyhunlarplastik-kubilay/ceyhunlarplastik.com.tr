"use client"

import {
    BadgePercent,
    Building2,
    CalendarClock,
    CreditCard,
    Factory,
    Mail,
    MapPin,
    Phone,
    UserRound,
    UsersRound,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { AdminCustomer } from "@/features/admin/customers/api/types"
import { formatMoney } from "@/lib/customers/pricing"

type ProfileSummaryItem = {
    label: string
    value: string
    icon: typeof Building2
    accent?: "amber" | "slate"
}

type Props = {
    customer: AdminCustomer
    assignedSalesDisplayName?: string
}

function formatOptional(value?: string | number | null) {
    if (value === null || value === undefined || value === "") return "-"
    return String(value)
}

function formatDiscount(value?: number | null) {
    if (value === null || value === undefined || !Number.isFinite(value)) return "Tanımlı değil"
    return `%${value.toLocaleString("tr-TR", {
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    })}`
}

function formatPaymentTerm(days?: number | null) {
    if (days === null || days === undefined || !Number.isFinite(days)) return "Tanımlı değil"
    return `${days} Gün`
}

function buildCustomerProfileSummaryItems(
    customer: AdminCustomer,
    assignedSalesDisplayName?: string,
): ProfileSummaryItem[] {
    return [
        {
            label: "Firma",
            value: formatOptional(customer.companyName),
            icon: Building2,
        },
        {
            label: "Yetkili",
            value: formatOptional(customer.fullName),
            icon: UserRound,
        },
        {
            label: "Telefon",
            value: formatOptional(customer.phone),
            icon: Phone,
        },
        {
            label: "E-posta",
            value: formatOptional(customer.email),
            icon: Mail,
        },
        {
            label: "Sektör",
            value: formatOptional(customer.sectorValue?.name),
            icon: Factory,
        },
        {
            label: "Üretim Grubu",
            value: formatOptional(customer.productionGroupValue?.name),
            icon: Factory,
        },
        {
            label: "Kullanım Alanı",
            value: `${customer.usageAreaValues?.length ?? 0} alan`,
            icon: MapPin,
        },
        {
            label: "Portal Kullanıcısı",
            value: `${customer.portalUsers?.length ?? 0} kişi`,
            icon: UsersRound,
        },
        {
            label: "Satış Temsilcisi",
            value: assignedSalesDisplayName || "Atanmadı",
            icon: UserRound,
            accent: "amber",
        },
    ]
}

export function CustomerPortalProfileSummaryCard({
    customer,
    assignedSalesDisplayName,
}: Props) {
    const summaryItems = buildCustomerProfileSummaryItems(customer, assignedSalesDisplayName)
    const hasCommercialNote = Boolean(customer.paymentTermNote?.trim() || customer.note?.trim())

    return (
        <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_18px_45px_-34px_rgba(15,23,42,0.45)]">
            <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_62%,#fff7ed_100%)] px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Müşteri Profil Özeti
                        </div>
                        <h2 className="mt-2 line-clamp-2 text-lg font-semibold tracking-tight text-slate-950">
                            {customer.companyName || customer.fullName}
                        </h2>
                    </div>
                    <Badge className={customer.status === "CUSTOMER"
                        ? "border border-slate-200 bg-slate-950 text-white hover:bg-slate-950"
                        : "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50"}
                    >
                        {customer.status === "CUSTOMER" ? "Müşteri" : "Potansiyel"}
                    </Badge>
                </div>
            </div>

            <div className="space-y-4 p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                            <BadgePercent className="h-3.5 w-3.5" />
                            Genel İskonto
                        </div>
                        <div className="mt-2 truncate text-sm font-semibold text-slate-950">
                            {formatDiscount(customer.generalDiscountPercent)}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                            <CalendarClock className="h-3.5 w-3.5" />
                            Vade
                        </div>
                        <div className="mt-2 truncate text-sm font-semibold text-slate-950">
                            {formatPaymentTerm(customer.defaultPaymentTermDays)}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3">
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-amber-700">
                            {/* <CreditCard className="h-3.5 w-3.5" />
                            Kredi Limiti */}
                            <CreditCard className="h-3.5 w-3.5" />
                            Açık Hesap Kredi Limiti
                        </div>
                        <div className="mt-2 truncate text-sm font-semibold text-amber-950">
                            {customer.creditLimit !== null && customer.creditLimit !== undefined
                                ? formatMoney(customer.creditLimit)
                                : "Tanımlı değil"}
                        </div>
                    </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                    {summaryItems.map((item) => {
                        const Icon = item.icon

                        return (
                            <div
                                key={item.label}
                                className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5"
                            >
                                <span className={`shrink-0 rounded-full border p-2 ${item.accent === "amber"
                                    ? "border-amber-200 bg-amber-50 text-amber-700"
                                    : "border-slate-200 bg-slate-50 text-slate-500"}`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-[11px] uppercase tracking-[0.14em] text-slate-400">
                                        {item.label}
                                    </span>
                                    <span className="block truncate text-sm font-medium text-slate-950" title={item.value}>
                                        {item.value}
                                    </span>
                                </span>
                            </div>
                        )
                    })}
                </div>

                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <Badge variant="outline" className="bg-white">
                        {customer.addresses?.length ?? 0} adres
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                        {customer.featuredProducts?.length ?? 0} ilgili ürün
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                        {customer.assignedProducts?.length ?? 0} tanımlı ürün
                    </Badge>
                    {hasCommercialNote ? (
                        <Badge className="border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50">
                            Not var
                        </Badge>
                    ) : null}
                </div>
            </div>
        </section>
    )
}
