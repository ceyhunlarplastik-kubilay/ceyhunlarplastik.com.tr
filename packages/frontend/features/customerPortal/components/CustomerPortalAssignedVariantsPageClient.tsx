"use client"

import { Boxes, PackageSearch } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { usePortalAssignedProducts } from "@/features/customerPortal/hooks/usePortalAssignedProducts"
import { CustomerPortalAssignedVariantCard } from "@/features/customerPortal/components/CustomerPortalAssignedVariantCard"
import {
    CustomerPortalPageHeader,
    CustomerPortalPageHeaderStat,
} from "@/features/customerPortal/components/CustomerPortalPageHeader"

export function CustomerPortalAssignedVariantsPageClient() {
    const assignedQuery = usePortalAssignedProducts()
    const items = [...(assignedQuery.data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder)

    return (
        <div className="space-y-6">
            <CustomerPortalPageHeader
                eyebrow="Tanımlı Varyant Portföyü"
                icon={Boxes}
                title="Tanımlı Ürün Varyantları"
                description="Firmanız için sürekli veya yüksek hacimde çalışılan ürün varyantlarını burada takip edebilirsiniz."
                meta={[
                    { value: `${items.length}`, label: "varyant" },
                ]}
                aside={(
                    <CustomerPortalPageHeaderStat
                        label="Operasyonel varyant portföyünüz"
                        value={`${items.length} varyant`}
                    />
                )}
            />

            <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
                {assignedQuery.isLoading ? (
                    <div className="flex min-h-[320px] items-center justify-center">
                        <Spinner className="size-5" />
                    </div>
                ) : items.length > 0 ? (
                    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {items.map((item) => (
                            <li key={item.id}>
                                <CustomerPortalAssignedVariantCard item={item} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-10 text-center text-sm text-neutral-500">
                        <PackageSearch className="mx-auto mb-3 h-8 w-8 text-neutral-400" />
                        Henüz firmanız için tanımlı ürün varyantı bulunmuyor.
                    </div>
                )}
            </div>
        </div>
    )
}
