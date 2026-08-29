"use client"

import { useMemo } from "react"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { Heart, PackageSearch, UserRoundCog } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
    CustomerAssignedProduct,
    CustomerAssignedProductSource,
} from "@/features/admin/customers/api/types"
import { usePortalAssignedProducts } from "@/features/customerPortal/hooks/usePortalAssignedProducts"
import { CustomerPortalAssignedVariantCard } from "@/features/customerPortal/components/CustomerPortalAssignedVariantCard"
import {
    CustomerPortalPageHeader,
    CustomerPortalPageHeaderStat,
} from "@/features/customerPortal/components/CustomerPortalPageHeader"

/**
 * Favori varyantlar iki kaynaktan gelir: temsilci/admin ataması (STAFF) ve
 * müşterinin kendi kalp işareti (CUSTOMER). Sekme seçimi paylaşılabilir olsun
 * diye URL'de tutulur (nuqs) — repo kuralı: filtre/görünüm durumu useState değil.
 */
type TabValue = "all" | CustomerAssignedProductSource

const TAB_VALUES = ["all", "STAFF", "CUSTOMER"] as const

const TABS: Array<{ value: TabValue; label: string }> = [
    { value: "all", label: "Tümü" },
    { value: "STAFF", label: "Temsilci Seçimi" },
    { value: "CUSTOMER", label: "Kendi Favorilerim" },
]

// Bilinmeyen/elle düzenlenmiş `?kaynak=` değeri "all"a düşer.
const tabParser = parseAsStringLiteral(TAB_VALUES).withDefault("all")

function sortItems(items: CustomerAssignedProduct[]) {
    return [...items].sort((a, b) => a.displayOrder - b.displayOrder)
}

export function CustomerPortalFavoriteVariantsPageClient() {
    const assignedQuery = usePortalAssignedProducts()
    const [activeTab, setTab] = useQueryState("kaynak", tabParser)

    const { all, staff, customer } = useMemo(() => {
        const data = assignedQuery.data ?? []

        return {
            all: sortItems(data),
            staff: sortItems(data.filter((item) => item.source === "STAFF")),
            customer: sortItems(data.filter((item) => item.source === "CUSTOMER")),
        }
    }, [assignedQuery.data])

    const itemsByTab: Record<TabValue, CustomerAssignedProduct[]> = {
        all,
        STAFF: staff,
        CUSTOMER: customer,
    }

    const counts: Record<TabValue, number> = {
        all: all.length,
        STAFF: staff.length,
        CUSTOMER: customer.length,
    }

    return (
        <div className="space-y-6">
            <CustomerPortalPageHeader
                eyebrow="Favori Varyant Portföyü"
                icon={Heart}
                title="Favori Ürün Varyantlarım"
                description="Temsilcinizin sizin için tanımladığı ve kendi favorilerinize eklediğiniz ürün varyantlarını burada birlikte takip edebilirsiniz."
                meta={[
                    { value: `${counts.all}`, label: "varyant" },
                    { value: `${counts.CUSTOMER}`, label: "kendi favorim" },
                ]}
                aside={(
                    <CustomerPortalPageHeaderStat
                        label="Operasyonel varyant portföyünüz"
                        value={`${counts.all} varyant`}
                    />
                )}
            />

            <Tabs
                value={activeTab}
                // Radix `string` verir; "all" varsayılan olduğu için URL'den düşürülür.
                onValueChange={(value) => {
                    const next = TAB_VALUES.find((tab) => tab === value) ?? "all"
                    void setTab(next === "all" ? null : next)
                }}
                className="gap-4"
            >
                <TabsList className="h-auto w-full justify-start gap-1 rounded-[22px] bg-neutral-100/80 p-1">
                    {TABS.map((tab) => (
                        <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="gap-2 rounded-[18px] px-4 py-2 text-sm"
                        >
                            {tab.value === "STAFF" ? <UserRoundCog className="h-4 w-4" /> : null}
                            {tab.value === "CUSTOMER" ? <Heart className="h-4 w-4" /> : null}
                            <span>{tab.label}</span>
                            <span className="rounded-full bg-white/70 px-1.5 text-[11px] font-semibold text-neutral-600">
                                {counts[tab.value]}
                            </span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {TABS.map((tab) => (
                    <TabsContent key={tab.value} value={tab.value} className="m-0">
                        <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
                            {assignedQuery.isLoading ? (
                                <div className="flex min-h-80 items-center justify-center">
                                    <Spinner className="size-5" />
                                </div>
                            ) : itemsByTab[tab.value].length > 0 ? (
                                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                    {itemsByTab[tab.value].map((item) => (
                                        <li key={item.id}>
                                            <CustomerPortalAssignedVariantCard item={item} />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <FavoriteVariantsEmptyState tab={tab.value} />
                            )}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}

function FavoriteVariantsEmptyState({ tab }: { tab: TabValue }) {
    const message = tab === "CUSTOMER"
        ? "Henüz kendi favorinize eklediğiniz varyant yok. Ürün varyantlarındaki kalp simgesine dokunarak ekleyebilirsiniz."
        : tab === "STAFF"
            ? "Temsilciniz henüz sizin için varyant tanımlamamış."
            : "Henüz firmanız için favori ürün varyantı bulunmuyor."

    return (
        <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-10 text-center text-sm text-neutral-500">
            {tab === "CUSTOMER"
                ? <Heart className="mx-auto mb-3 h-8 w-8 text-neutral-400" />
                : <PackageSearch className="mx-auto mb-3 h-8 w-8 text-neutral-400" />}
            {message}
        </div>
    )
}
