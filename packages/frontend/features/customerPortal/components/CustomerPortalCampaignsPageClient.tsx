"use client"

import { useMemo } from "react"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { Megaphone, PackageSearch, Sparkles } from "lucide-react"

import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePortalAssignedProducts } from "@/features/customerPortal/hooks/usePortalAssignedProducts"
import { usePortalCampaigns } from "@/features/customerPortal/hooks/usePortalCampaigns"
import { flattenCampaignVariants } from "@/features/customerPortal/lib/campaignRelevance"
import { CustomerPortalCampaignVariantCard } from "@/features/customerPortal/components/CustomerPortalCampaignVariantCard"
import {
    CustomerPortalPageHeader,
    CustomerPortalPageHeaderStat,
} from "@/features/customerPortal/components/CustomerPortalPageHeader"

/**
 * Favori sayfasıyla aynı sekme deseni: seçim URL'de (`?kapsam=`) tutulur,
 * bilinmeyen değer "all"a düşer.
 */
type TabValue = "all" | "relevant"

const TAB_VALUES = ["all", "relevant"] as const
const tabParser = parseAsStringLiteral(TAB_VALUES).withDefault("all")

export function CustomerPortalCampaignsPageClient() {
    const campaignsQuery = usePortalCampaigns()
    const assignedQuery = usePortalAssignedProducts()
    const [activeTab, setTab] = useQueryState("kapsam", tabParser)

    // "Bana uygun" = favori + temsilci tanımlı varyantlarımla kesişim.
    const relevantVariantIds = useMemo(
        () => new Set((assignedQuery.data ?? []).map((item) => item.productVariantId)),
        [assignedQuery.data],
    )

    const entries = useMemo(
        () => flattenCampaignVariants(campaignsQuery.data ?? [], relevantVariantIds),
        [campaignsQuery.data, relevantVariantIds],
    )

    const relevantEntries = useMemo(
        () => entries.filter((entry) => entry.isRelevant),
        [entries],
    )

    const entriesByTab: Record<TabValue, typeof entries> = {
        all: entries,
        relevant: relevantEntries,
    }

    const counts: Record<TabValue, number> = {
        all: entries.length,
        relevant: relevantEntries.length,
    }

    const isLoading = campaignsQuery.isLoading || assignedQuery.isLoading

    return (
        <div className="space-y-6">
            <CustomerPortalPageHeader
                eyebrow="Kampanyalar"
                icon={Megaphone}
                title="Kampanyalı Ürün Varyantları"
                description="Güncel kampanyalardaki ürün varyantlarını buradan görebilirsiniz. Kampanya indirimi listeye açıktır; firmanıza özel tanımlı bir fiyat varsa o fiyat geçerli kalır."
                meta={[
                    { value: `${counts.all}`, label: "kampanyalı varyant" },
                    { value: `${counts.relevant}`, label: "size uygun" },
                ]}
                aside={(
                    <CustomerPortalPageHeaderStat
                        label="Güncel kampanyalı varyant"
                        value={`${counts.all} varyant`}
                    />
                )}
            />

            <Tabs
                value={activeTab}
                onValueChange={(value) => {
                    const next = TAB_VALUES.find((tab) => tab === value) ?? "all"
                    void setTab(next === "all" ? null : next)
                }}
                className="gap-4"
            >
                <TabsList className="h-auto w-full justify-start gap-1 rounded-[22px] bg-neutral-100/80 p-1">
                    <TabsTrigger value="all" className="gap-2 rounded-[18px] px-4 py-2 text-sm">
                        <Megaphone className="h-4 w-4" />
                        <span>Tüm Kampanyalar</span>
                        <span className="rounded-full bg-white/70 px-1.5 text-[11px] font-semibold text-neutral-600">
                            {counts.all}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="relevant" className="gap-2 rounded-[18px] px-4 py-2 text-sm">
                        <Sparkles className="h-4 w-4" />
                        <span>Bana Uygun</span>
                        <span className="rounded-full bg-white/70 px-1.5 text-[11px] font-semibold text-neutral-600">
                            {counts.relevant}
                        </span>
                    </TabsTrigger>
                </TabsList>

                {TAB_VALUES.map((tab) => (
                    <TabsContent key={tab} value={tab} className="m-0">
                        <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
                            {isLoading ? (
                                <div className="flex min-h-80 items-center justify-center">
                                    <Spinner className="size-5" />
                                </div>
                            ) : entriesByTab[tab].length > 0 ? (
                                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                    {entriesByTab[tab].map((entry) => (
                                        <li key={entry.key}>
                                            <CustomerPortalCampaignVariantCard entry={entry} />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <CampaignsEmptyState tab={tab} />
                            )}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}

function CampaignsEmptyState({ tab }: { tab: TabValue }) {
    const message = tab === "relevant"
        ? "Favori ve tanımlı varyantlarınızda şu an kampanya yok. Tüm Kampanyalar sekmesinden güncel kampanyalara göz atabilirsiniz."
        : "Şu anda yayında olan bir kampanya bulunmuyor."

    return (
        <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-10 text-center text-sm text-neutral-500">
            {tab === "relevant"
                ? <Sparkles className="mx-auto mb-3 h-8 w-8 text-neutral-400" />
                : <PackageSearch className="mx-auto mb-3 h-8 w-8 text-neutral-400" />}
            {message}
        </div>
    )
}
