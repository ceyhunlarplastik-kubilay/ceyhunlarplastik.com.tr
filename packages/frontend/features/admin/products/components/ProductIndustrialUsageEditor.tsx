"use client"

import { useMemo } from "react"
import { Factory, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAttributesForFilter } from "@/features/admin/productAttributes/hooks/useAttributesForFilter"
import type { ProductIndustrialUsageFormValues } from "@/features/admin/products/schema/productFormSchema"

const NONE_VALUE = "__none__"
const INDUSTRIAL_ATTRIBUTE_CODES = {
    sector: "sector",
    productionGroup: "production_group",
    usageArea: "usage_area",
} as const

type AttributeValueOption = {
    id: string
    name: string
    parentValueId?: string | null
}

type Props = {
    value: ProductIndustrialUsageFormValues[]
    onChange: (value: ProductIndustrialUsageFormValues[]) => void
}

function normalizeRows(rows: ProductIndustrialUsageFormValues[]) {
    return rows.map((row, index) => ({
        ...row,
        sectorValueId: row.sectorValueId || null,
        productionGroupValueId: row.productionGroupValueId || null,
        usageAreaValueId: row.usageAreaValueId || null,
        usageFunction: row.usageFunction ?? "",
        displayOrder: index,
    }))
}

function keepSelectedOption(options: AttributeValueOption[], allOptions: AttributeValueOption[], selectedId?: string | null) {
    if (!selectedId || options.some((item) => item.id === selectedId)) return options
    const selected = allOptions.find((item) => item.id === selectedId)
    return selected ? [selected, ...options] : options
}

export function ProductIndustrialUsageEditor({ value, onChange }: Props) {
    const { data: attributes, isLoading } = useAttributesForFilter()

    const sectorValues = useMemo(
        () => attributes?.find((attribute) => attribute.code === INDUSTRIAL_ATTRIBUTE_CODES.sector)?.values ?? [],
        [attributes],
    )
    const productionGroupValues = useMemo(
        () => attributes?.find((attribute) => attribute.code === INDUSTRIAL_ATTRIBUTE_CODES.productionGroup)?.values ?? [],
        [attributes],
    )
    const usageAreaValues = useMemo(
        () => attributes?.find((attribute) => attribute.code === INDUSTRIAL_ATTRIBUTE_CODES.usageArea)?.values ?? [],
        [attributes],
    )

    function emit(rows: ProductIndustrialUsageFormValues[]) {
        onChange(normalizeRows(rows))
    }

    function updateRow(index: number, patch: Partial<ProductIndustrialUsageFormValues>) {
        emit(value.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)))
    }

    function addRow() {
        emit([
            ...value,
            {
                sectorValueId: null,
                productionGroupValueId: null,
                usageAreaValueId: null,
                usageFunction: "",
                displayOrder: value.length,
            },
        ])
    }

    function removeRow(index: number) {
        emit(value.filter((_, rowIndex) => rowIndex !== index))
    }

    return (
        <section className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-amber-200 bg-white p-2 text-amber-700 shadow-sm">
                        <Factory className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-neutral-900">Endüstriyel Kullanım Alanları</div>
                        <p className="mt-1 max-w-2xl text-xs leading-5 text-neutral-600">
                            Sektör, üretim grubu ve kullanım alanı artık kategori filtre attribute&apos;u değil; ürünün endüstriyel kullanım satırları olarak yönetilir.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full border-amber-200 bg-white text-amber-800">
                        {value.length} satır
                    </Badge>
                    <Button type="button" size="sm" onClick={addRow} className="rounded-full">
                        <Plus className="mr-1.5 h-4 w-4" />
                        Satır Ekle
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="rounded-2xl border border-dashed border-amber-200 bg-white/70 px-4 py-5 text-sm text-neutral-500">
                    Endüstriyel taxonomy değerleri yükleniyor...
                </div>
            ) : value.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-amber-200 bg-white/70 px-4 py-6 text-sm text-neutral-600">
                    Henüz kullanım satırı eklenmedi. Ürün detayındaki endüstriyel kullanım tablosunu ve müşteri profil eşleşmesini beslemek için satır ekleyin.
                </div>
            ) : (
                <div className="space-y-3">
                    {value.map((row, index) => {
                        const visibleProductionGroups = row.sectorValueId
                            ? productionGroupValues.filter((item) => item.parentValueId === row.sectorValueId)
                            : productionGroupValues
                        const visibleUsageAreas = row.productionGroupValueId
                            ? usageAreaValues.filter((item) => item.parentValueId === row.productionGroupValueId)
                            : usageAreaValues
                        const productionOptions = keepSelectedOption(visibleProductionGroups, productionGroupValues, row.productionGroupValueId)
                        const usageAreaOptions = keepSelectedOption(visibleUsageAreas, usageAreaValues, row.usageAreaValueId)

                        return (
                            <div key={index} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                                        Satır {index + 1}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 rounded-full px-2 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                                        onClick={() => removeRow(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Satırı kaldır</span>
                                    </Button>
                                </div>

                                <div className="grid gap-3 lg:grid-cols-3">
                                    <Select
                                        value={row.sectorValueId ?? NONE_VALUE}
                                        onValueChange={(nextValue) =>
                                            updateRow(index, {
                                                sectorValueId: nextValue === NONE_VALUE ? null : nextValue,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full rounded-xl">
                                            <SelectValue placeholder="Sektör" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={NONE_VALUE}>Sektör yok</SelectItem>
                                            {sectorValues.map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={row.productionGroupValueId ?? NONE_VALUE}
                                        onValueChange={(nextValue) =>
                                            updateRow(index, {
                                                productionGroupValueId: nextValue === NONE_VALUE ? null : nextValue,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full rounded-xl">
                                            <SelectValue placeholder="Üretim Grubu" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={NONE_VALUE}>Üretim grubu yok</SelectItem>
                                            {productionOptions.map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={row.usageAreaValueId ?? NONE_VALUE}
                                        onValueChange={(nextValue) =>
                                            updateRow(index, {
                                                usageAreaValueId: nextValue === NONE_VALUE ? null : nextValue,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full rounded-xl">
                                            <SelectValue placeholder="Kullanım Alanı" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={NONE_VALUE}>Kullanım alanı yok</SelectItem>
                                            {usageAreaOptions.map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Textarea
                                    value={row.usageFunction ?? ""}
                                    onChange={(event) => updateRow(index, { usageFunction: event.target.value })}
                                    rows={3}
                                    className="mt-3 rounded-xl"
                                    placeholder="Bu ürün bu kullanım alanında nasıl fayda sağlar? Örn. Çekyat gövdesine cıvata bağlantısı ile sabitlenerek sağlam taşıyıcı ayak görevi görür."
                                />
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}
