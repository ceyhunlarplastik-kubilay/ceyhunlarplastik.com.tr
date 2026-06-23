"use client"

import { BadgePercent, PackageSearch } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { usePortalSpecialPrices } from "@/features/customerPortal/hooks/usePortalSpecialPrices"
import { CustomerPortalSpecialPriceCard } from "@/features/customerPortal/specialPrices/components/CustomerPortalSpecialPriceCard"

export function CustomerPortalSpecialPricesPageClient() {
    const specialPricesQuery = usePortalSpecialPrices()
    const items = specialPricesQuery.data?.data ?? []

    return (
        <div className="space-y-6">
            <div className="overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-sm">
                <div className="bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-5 py-7 sm:px-7">
                    <Badge variant="secondary" className="gap-1.5">
                        <BadgePercent className="h-3.5 w-3.5" />
                        Müşteri özel koşulları
                    </Badge>
                    <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950">Özel Fiyatlı Ürünler</h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
                        Firmanıza özel tanımlanmış fiyat, vade ve minimum sipariş koşullarını buradan görüntüleyebilirsiniz.
                    </p>
                </div>
            </div>

            {specialPricesQuery.isLoading ? (
                <div className="rounded-[28px] border border-neutral-200 bg-white p-6 text-sm text-neutral-500 shadow-sm">
                    Özel fiyatlı ürünler yükleniyor...
                </div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-[28px] border border-neutral-200 bg-white px-6 py-16 text-center shadow-sm">
                    <PackageSearch className="h-9 w-9 text-neutral-400" />
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-neutral-950">Aktif ve geçerli özel fiyatlı ürün bulunmuyor</h2>
                        <p className="max-w-xl text-sm leading-6 text-neutral-500">
                            Firmanız için aktif ve tarih aralığında geçerli bir özel fiyat tanımlandığında burada görünecek.
                            Süresi dolmuş veya henüz başlamamış kayıtlar bu listede gösterilmez.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-5">
                    {items.map((item, index) => (
                        <CustomerPortalSpecialPriceCard key={item.id} item={item} index={index} />
                    ))}
                </div>
            )}
        </div>
    )
}
