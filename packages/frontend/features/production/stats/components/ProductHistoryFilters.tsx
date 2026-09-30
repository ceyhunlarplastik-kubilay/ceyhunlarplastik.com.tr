"use client"

import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProductHistory } from "@/features/production/stats/api/types"
import { versionText } from "@/features/production/stats/lib/productHistoryFormat"
import { StatsDateInputs, StatsQuickRangeButtons } from "./StatsRangeControls"

const ALL = "__all__"

type Props = {
    productOptions: SearchableSelectOption[]
    productsLoading: boolean
    productId: string
    sizeId: string
    version: string
    from: string
    to: string
    today: string
    /** Seçili ürünün ölçü / versiyon seçenekleri (yanıttan); ürün seçilmeden boş. */
    sizes: ProductHistory["sizes"]
    versions: ProductHistory["versions"]
    onProductChange: (productId: string | null) => void
    onSizeChange: (sizeId: string | null) => void
    onVersionChange: (version: string | null) => void
    onRangeChange: (range: { from: string; to: string }) => void
}

/** Ürün modeli → ölçü → versiyon + tarih aralığı (hızlı aralıklarla). Değerler URL'de. */
export function ProductHistoryFilters({
    productOptions,
    productsLoading,
    productId,
    sizeId,
    version,
    from,
    to,
    today,
    sizes,
    versions,
    onProductChange,
    onSizeChange,
    onVersionChange,
    onRangeChange,
}: Props) {
    return (
        <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_9.5rem_9.5rem]">
                <SearchableSelect
                    value={productId || null}
                    onValueChange={onProductChange}
                    options={productOptions}
                    placeholder="Ürün modeli seçin"
                    searchPlaceholder="Kod ya da ad ara"
                    loading={productsLoading}
                    allowClear={false}
                    className="w-full"
                    aria-label="Ürün modeli"
                />
                <Select value={sizeId || ALL} onValueChange={(value) => onSizeChange(value === ALL ? null : value)} disabled={!productId}>
                    <SelectTrigger className="w-full" aria-label="Ölçü">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Tüm ölçüler</SelectItem>
                        {sizes.map((size) => (
                            <SelectItem key={size.id} value={size.id}>{size.sizeCode}{size.label ? ` · ${size.label}` : ""}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={version || ALL} onValueChange={(value) => onVersionChange(value === ALL ? null : value)} disabled={!productId}>
                    <SelectTrigger className="w-full" aria-label="Versiyon (renk + hammadde)">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Tüm versiyonlar</SelectItem>
                        {versions.map((entry) => (
                            <SelectItem key={entry.signature} value={entry.signature}>{versionText(entry)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <StatsDateInputs from={from} to={to} onRangeChange={onRangeChange} />
            </div>
            <StatsQuickRangeButtons from={from} to={to} today={today} onRangeChange={onRangeChange} />
        </div>
    )
}
