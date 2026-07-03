"use client"

import { BadgePercent, PackageSearch, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePortalSpecialPrices } from "@/features/customerPortal/hooks/usePortalSpecialPrices"
import { CustomerPortalSpecialPriceCard } from "@/features/customerPortal/specialPrices/components/CustomerPortalSpecialPriceCard"
import { CustomerPortalSpecialPriceRequestDialog } from "@/features/customerPortal/specialPrices/components/CustomerPortalSpecialPriceRequestDialog"
import { CustomerPortalSpecialPriceRequestsList } from "@/features/customerPortal/specialPrices/components/CustomerPortalSpecialPriceRequestsList"

export function CustomerPortalSpecialPricesPageClient() {
    const specialPricesQuery = usePortalSpecialPrices()
    const items = specialPricesQuery.data?.data ?? []

    return (
        <div className="space-y-6">
            <div className="overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-sm">
                <div className="flex min-h-[220px] flex-col bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-5 py-7 sm:px-7">
                    <div>
                        <Badge variant="secondary" className="gap-1.5">
                            <BadgePercent className="h-3.5 w-3.5" />
                            Müşteri özel koşulları
                        </Badge>
                        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950">Özel Fiyatlı Ürünler ve Talepler</h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
                            Firmanıza özel tanımlanmış fiyat, vade ve minimum sipariş koşullarını buradan görüntüleyebilir; yeni özel fiyat talebi iletebilirsiniz.
                        </p>
                    </div>
                    <div className="mt-auto flex justify-end pt-6">
                        <CustomerPortalSpecialPriceRequestDialog
                            trigger={(
                                <Button type="button" className="w-fit gap-2">
                                    <Plus className="h-4 w-4" />
                                    Özel Fiyat Talebi Oluştur
                                </Button>
                            )}
                        />
                    </div>
                </div>
            </div>

            <section className="-mx-2 border-y border-neutral-200 bg-neutral-50/60 px-2 py-6 sm:-mx-4 sm:px-4">
                <CustomerPortalSpecialPriceRequestsList />
            </section>

            <section className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight text-neutral-950">Özel Fiyatlar</h2>
                        <p className="mt-1 text-sm leading-6 text-neutral-500">
                            Onaylanmış, aktif ve geçerli özel fiyatlı ürünleriniz.
                        </p>
                    </div>
                    <Badge variant="outline" className="w-fit bg-white">
                        {items.length} ürün
                    </Badge>
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
            </section>
        </div>
    )
}
