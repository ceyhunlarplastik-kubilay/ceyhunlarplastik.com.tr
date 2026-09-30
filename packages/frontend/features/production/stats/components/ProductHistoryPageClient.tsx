"use client"

import { useMemo, useState } from "react"
import { parseAsString, useQueryStates } from "nuqs"
import { FileSpreadsheet, History } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { isValidDateKey } from "@core/helpers/production/productionCalendar"
import { defaultStatsRange } from "@core/helpers/production/productionStats"
import { productionDateKey } from "@core/helpers/production/productionTime"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { useReferenceProducts } from "@/features/production/references/hooks/useProductionReferences"
import { ProductionPageHeader } from "@/features/production/shared/components/ProductionPageHeader"
import { useNow } from "@/features/production/shared/hooks/useNow"
import type { ProductHistory } from "@/features/production/stats/api/types"
import { useProductHistory } from "@/features/production/stats/hooks/useProductHistory"
import { versionText } from "@/features/production/stats/lib/productHistoryFormat"
import { ProductHistoryCharts } from "./ProductHistoryCharts"
import { ProductHistoryFilters } from "./ProductHistoryFilters"
import { ProductHistorySummaryCards } from "./ProductHistorySummaryCards"
import { ProductHistoryTable } from "./ProductHistoryTable"
import { StatsErrorState } from "./StatsErrorState"

function filterDescription(history: ProductHistory, sizeId: string, version: string): string {
    const size = history.sizes.find((entry) => entry.id === sizeId)
    const selectedVersion = history.versions.find((entry) => entry.signature === version)
    return [
        size ? `Ölçü ${size.sizeCode}` : "Tüm ölçüler",
        selectedVersion ? `Versiyon ${versionText(selectedVersion)}` : "Tüm versiyonlar",
    ].join(" · ")
}

/**
 * Ürün geçmişi (Faz 5.1): ürün modeli → ölçü → versiyon süzgeçli, pencere içindeki her üretim.
 * Süzgeçler URL'de (paylaşılabilir). Hesap sunucuda (`core/helpers/production/productionStats.ts`);
 * burada gösterim ve Excel.
 */
export function ProductHistoryPageClient() {
    const [{ urun, olcu, versiyon, bas, bit }, setState] = useQueryStates({
        urun: parseAsString.withDefault(""),
        olcu: parseAsString.withDefault(""),
        versiyon: parseAsString.withDefault(""),
        bas: parseAsString,
        bit: parseAsString,
    })
    const now = useNow()
    const today = productionDateKey(now)
    const defaults = defaultStatsRange(now)
    const from = bas && isValidDateKey(bas) ? bas : defaults.from
    const to = bit && isValidDateKey(bit) && bit >= from ? bit : defaults.to
    const [exporting, setExporting] = useState(false)

    const productsQuery = useReferenceProducts({ moldable: true })
    const productOptions = useMemo(
        () => (productsQuery.data ?? []).map((product) => ({ value: product.id, label: `${product.code} · ${product.name}`, keywords: product.code })),
        [productsQuery.data],
    )
    const historyQuery = useProductHistory(urun ? { productId: urun, sizeId: olcu, version: versiyon, from, to } : null)
    // Ürün değişirken önceki ürünün verisi gösterilmez (yalnız aynı ürünün süzgeç değişiminde).
    const history = historyQuery.data && historyQuery.data.product.id === urun ? historyQuery.data : null
    const isInitialLoading = Boolean(urun) && !history
    const isBackgroundRefetch = historyQuery.isFetching && Boolean(history)

    async function exportExcel() {
        if (!history) return
        setExporting(true)
        try {
            const { buildProductHistoryWorkbook, downloadWorkbook } = await import("@/features/production/stats/lib/productHistoryWorkbook")
            const { buffer, fileName } = await buildProductHistoryWorkbook(history, filterDescription(history, olcu, versiyon))
            downloadWorkbook(buffer as ArrayBuffer, fileName)
        } catch {
            toast.error("Excel dosyası oluşturulamadı")
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="space-y-6">
            <ProductionPageHeader
                icon={<History />}
                title="Ürün Geçmişi"
                description="Bir ürün modelinin her üretimi: hangi makinede, hangi kalıpla, kaç vardiyada, kaç adet ve ne kadar fireyle. Tamamlanan işte adet kapanıştaki kesin sayım, sürende raporlu vardiyaların toplamı; gerçek çevrim vardiya raporlarından."
                action={(
                    <Button type="button" variant="outline" className="rounded-2xl" disabled={!history || history.rows.length === 0 || exporting} onClick={() => void exportExcel()}>
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel&apos;e aktar
                    </Button>
                )}
            />

            <ProductHistoryFilters
                productOptions={productOptions}
                productsLoading={productsQuery.isLoading}
                productId={urun}
                sizeId={olcu}
                version={versiyon}
                from={from}
                to={to}
                today={today}
                sizes={history?.sizes ?? []}
                versions={history?.versions ?? []}
                onProductChange={(productId) => void setState({ urun: productId, olcu: null, versiyon: null })}
                onSizeChange={(sizeId) => void setState({ olcu: sizeId })}
                onVersionChange={(version) => void setState({ versiyon: version })}
                onRangeChange={(range) => void setState({
                    bas: range.from === defaults.from && range.to === defaults.to ? null : range.from,
                    bit: range.from === defaults.from && range.to === defaults.to ? null : range.to,
                })}
            />

            {!urun ? (
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon"><History /></EmptyMedia>
                        <EmptyTitle>Bir ürün modeli seçin</EmptyTitle>
                        <EmptyDescription>Ölçü ve versiyon süzgeci ürün seçilince açılır. Pencere varsayılan olarak son 12 ay.</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : isInitialLoading && historyQuery.isError ? (
                <StatsErrorState
                    onRetry={() => void historyQuery.refetch()}
                    retrying={historyQuery.isFetching}
                    onClearFilters={olcu || versiyon || bas || bit ? () => void setState({ olcu: null, versiyon: null, bas: null, bit: null }) : undefined}
                />
            ) : isInitialLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-24 rounded-2xl" />
                    <Skeleton className="h-72 rounded-2xl" />
                </div>
            ) : history && history.rows.length === 0 ? (
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon"><History /></EmptyMedia>
                        <EmptyTitle>Bu aralıkta üretim yok</EmptyTitle>
                        <EmptyDescription>
                            Üretime başlamış ya da bitmiş işler sayılır; planlı işler burada görünmez. Aralığı genişletin ya da süzgeci kaldırın.
                        </EmptyDescription>
                    </EmptyHeader>
                    {olcu || versiyon ? (
                        <EmptyContent>
                            <Button type="button" variant="outline" onClick={() => void setState({ olcu: null, versiyon: null })}>Süzgeçleri temizle</Button>
                        </EmptyContent>
                    ) : null}
                </Empty>
            ) : history ? (
                <div className="relative space-y-6" aria-busy={isBackgroundRefetch}>
                    <AdminSectionLoadingOverlay isVisible={isBackgroundRefetch} />
                    {history.summary.truncated ? (
                        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                            Aralıkta çok üretim var; yalnız en yeni {history.summary.jobCount} iş gösteriliyor. Aralığı daraltın.
                        </p>
                    ) : null}
                    <ProductHistorySummaryCards summary={history.summary} />
                    <ProductHistoryCharts rows={history.rows} />
                    <ProductHistoryTable rows={history.rows} />
                </div>
            ) : null}
        </div>
    )
}
