"use client"

import { useMemo, useState } from "react"
import { FileSpreadsheet, Loader2, MousePointerClick, RefreshCcw } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Category } from "@/features/public/categories/types"
import { useProductIndustrialUsageFunctions } from "@/features/admin/industrialUsageFunctions/hooks/useIndustrialUsageFunctions"
import { orderedLocales } from "@/features/admin/industrialUsageFunctions/lib/usageFunctionWorkbookFormat"
import { UsageFunctionExportCard } from "./UsageFunctionExportCard"
import { UsageFunctionImportCard } from "./UsageFunctionImportCard"
import {
    UsageFunctionProductPicker,
    type UsageFunctionPickerProduct,
} from "./UsageFunctionProductPicker"

type Props = {
    categories: Category[]
    workspaceLabel: string
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("tr-TR").format(value)
}

export function IndustrialUsageFunctionsPageClient({ categories, workspaceLabel }: Props) {
    const [selectedProduct, setSelectedProduct] = useState<UsageFunctionPickerProduct | null>(null)

    const usageFunctionsQuery = useProductIndustrialUsageFunctions(selectedProduct?.id ?? "")
    const payload = usageFunctionsQuery.data
    // Ürün değiştiğinde `placeholderData` bir önceki ürünün payload'ını tutar;
    // kart başlıkları yanlış ürünü göstermesin diye kimlik eşleşmesi aranır.
    const activePayload =
        payload && payload.product.id === selectedProduct?.id ? payload : undefined

    const localeCount = orderedLocales().length

    const missingCellCount = useMemo(() => {
        if (!activePayload) return 0

        return activePayload.rows.reduce((total, row) => {
            const filled = orderedLocales().filter(
                (locale) => row.usageFunctions[locale]?.trim(),
            ).length
            return total + (localeCount - filled)
        }, 0)
    }, [activePayload, localeCount])

    const statusText = (() => {
        if (!selectedProduct) return "Ürün seçin"
        if (usageFunctionsQuery.isLoading) return "Kullanım satırları yükleniyor"
        if (usageFunctionsQuery.isError) return "Veri okunamadı"
        return `${formatNumber(activePayload?.rows.length ?? 0)} kullanım satırı`
    })()

    const handleRefresh = async () => {
        await usageFunctionsQuery.refetch()
        toast.success("Veriler yenilendi")
    }

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
                <div className="bg-linear-to-br from-neutral-950 via-neutral-900 to-brand px-5 py-6 text-white sm:px-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <Badge className="border-white/15 bg-white/10 text-white" variant="outline">
                                {workspaceLabel}
                            </Badge>
                            <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                                Kullanım Fonksiyonu Aktarımı
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-white/70 sm:text-base">
                                Ürün modelinin endüstriyel kullanım tablosunu tek sayfada {localeCount} dil sütunu taşıyan
                                bir Excel dosyasına aktarın, kullanım fonksiyonu metinleri doldurulduktan sonra aynı
                                dosyayı geri yükleyin.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                                    Durum
                                </div>
                                <div className="mt-1 text-sm font-semibold">{statusText}</div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                                    Dil
                                </div>
                                <div className="mt-1 text-xl font-semibold">{localeCount}</div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                                    Eksik Hücre
                                </div>
                                <div className="mt-1 text-xl font-semibold">
                                    {formatNumber(missingCellCount)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {selectedProduct ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-5 py-4 sm:px-7">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                            <span className="font-mono text-xs font-semibold text-neutral-950">
                                {selectedProduct.code}
                            </span>
                            <span className="font-medium text-neutral-950">{selectedProduct.name}</span>
                            {activePayload?.product.categoryName ? (
                                <Badge variant="outline" className="rounded-full font-normal">
                                    {activePayload.product.categoryName}
                                </Badge>
                            ) : null}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-2xl"
                            onClick={handleRefresh}
                            disabled={usageFunctionsQuery.isFetching}
                        >
                            {usageFunctionsQuery.isFetching ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCcw className="h-4 w-4" />
                            )}
                            Yenile
                        </Button>
                    </div>
                ) : null}
            </section>

            <UsageFunctionProductPicker
                categories={categories}
                selectedProductId={selectedProduct?.id ?? null}
                onSelect={setSelectedProduct}
            />

            {!selectedProduct ? (
                <div className="rounded-3xl border border-dashed border-neutral-200 bg-white px-6 py-14 text-center shadow-sm">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
                        <MousePointerClick className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-neutral-950">
                        Aktarım için bir ürün modeli seçin
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
                        Her Excel dosyası tek bir ürün modeline aittir; içe aktarma sırasında dosyadaki ürün kimliği
                        seçili ürünle karşılaştırılır.
                    </p>
                </div>
            ) : usageFunctionsQuery.isError ? (
                <div className="rounded-3xl border border-red-200 bg-red-50/70 px-6 py-10 text-center">
                    <h3 className="text-base font-semibold text-red-800">
                        Kullanım satırları okunamadı
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm text-red-700">
                        Bağlantıyı kontrol edip yeniden deneyin.
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        className="mt-4 rounded-2xl"
                        onClick={handleRefresh}
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Yeniden Dene
                    </Button>
                </div>
            ) : !activePayload ? (
                <div className="rounded-3xl border border-neutral-200 bg-white px-6 py-14 text-center shadow-sm">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
                    <p className="mt-3 text-sm text-neutral-500">Kullanım satırları yükleniyor</p>
                </div>
            ) : activePayload.rows.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-neutral-200 bg-white px-6 py-14 text-center shadow-sm">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-neutral-100 text-neutral-400">
                        <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-neutral-950">
                        Bu üründe endüstriyel kullanım satırı yok
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
                        Önce &quot;Kullanım Alanı Ürün Atamaları&quot; sekmesinden bu ürüne kullanım alanı atayın;
                        kullanım fonksiyonu metinleri o satırlara yazılır.
                    </p>
                </div>
            ) : (
                <>
                    <UsageFunctionExportCard payload={activePayload} />
                    <UsageFunctionImportCard payload={activePayload} />
                </>
            )}
        </div>
    )
}
