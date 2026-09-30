"use client"

import { useMemo } from "react"
import { useFieldArray, useFormContext, useWatch } from "react-hook-form"
import { Plus, Trash2, TriangleAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    computeShotWeightG,
    findMoldOutputIssues,
    MAX_MOLD_OUTPUTS,
    sumCavities,
} from "@core/helpers/production/molds"
import {
    emptyMoldOutputRow,
    type MoldFormInput,
    type MoldFormValues,
} from "@/features/production/molds/schema/moldForm"
import {
    useReferenceProductSizes,
    useReferenceProducts,
} from "@/features/production/references/hooks/useProductionReferences"

function parseDecimal(value: string | undefined): number | null {
    const trimmed = (value ?? "").trim().replace(",", ".")
    if (!trimmed) return null
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : null
}

function MoldOutputRow({
    index,
    productOptions,
    productsLoading,
    onRemove,
}: {
    index: number
    productOptions: SearchableSelectOption[]
    productsLoading: boolean
    onRemove: () => void
}) {
    const form = useFormContext<MoldFormInput, unknown, MoldFormValues>()
    const productId = useWatch({ control: form.control, name: `outputs.${index}.productId` })
    const sizesQuery = useReferenceProductSizes(productId || null)
    const sizes = sizesQuery.data?.sizes ?? []

    return (
        <li className="space-y-3 rounded-2xl border p-3 sm:p-4">
            <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                    control={form.control}
                    name={`outputs.${index}.productId`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ürün modeli</FormLabel>
                            <SearchableSelect
                                value={field.value || null}
                                onValueChange={(value) => {
                                    field.onChange(value ?? "")
                                    // Ürün modeli değişince eski ölçü geçersizdir.
                                    form.setValue(`outputs.${index}.productSizeId`, "")
                                }}
                                options={productOptions}
                                placeholder="Ürün modeli seçin"
                                searchPlaceholder="Kod veya ad yazın"
                                loading={productsLoading}
                                allowClear={false}
                                className="w-full"
                                aria-label="Ürün modeli"
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name={`outputs.${index}.productSizeId`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ölçü</FormLabel>
                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={!productId || sizesQuery.isLoading}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={productId ? "Ölçü seçin" : "Önce ürün modeli seçin"} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {sizes.map((size) => (
                                        <SelectItem key={size.id} value={size.id}>
                                            {size.sizeCode}
                                            {size.label ? ` · ${size.label}` : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-[8rem_10rem_minmax(0,1fr)]">
                <FormField
                    control={form.control}
                    name={`outputs.${index}.cavities`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Göz sayısı</FormLabel>
                            <FormControl>
                                <Input inputMode="numeric" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name={`outputs.${index}.partWeightG`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Parça ağırlığı
                                <span className="font-normal text-muted-foreground">(g)</span>
                            </FormLabel>
                            <FormControl>
                                <Input inputMode="decimal" placeholder="—" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="col-span-2 flex justify-end sm:col-span-1">
                    <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
                        <Trash2 className="h-4 w-4" />
                        Kaldır
                    </Button>
                </div>
            </div>
        </li>
    )
}

/**
 * Kalıbın göz grupları: hangi ölçüden kaç göz. Aile kalıbında aynı ürün modelinin
 * farklı ölçüleri de, farklı ürün modelleri de olabilir. Kurallar core `molds.ts`.
 */
export function MoldOutputsField() {
    const form = useFormContext<MoldFormInput, unknown, MoldFormValues>()
    const { fields, append, remove } = useFieldArray({ control: form.control, name: "outputs" })
    const productsQuery = useReferenceProducts()

    const productOptions = useMemo<SearchableSelectOption[]>(
        () => (productsQuery.data ?? []).map((product) => ({
            value: product.id,
            label: `${product.code} · ${product.name}`,
            keywords: product.code,
        })),
        [productsQuery.data],
    )

    const watchedOutputs = useWatch({ control: form.control, name: "outputs" })
    const runnerWeight = useWatch({ control: form.control, name: "runnerWeightG" })

    const summary = useMemo(() => {
        const rows = (watchedOutputs ?? [])
            .filter((output) => output.productSizeId)
            .map((output) => ({
                productSizeId: output.productSizeId,
                cavities: Number(output.cavities) || 0,
                partWeightG: parseDecimal(output.partWeightG),
            }))
        const productCount = new Set((watchedOutputs ?? []).map((output) => output.productId).filter(Boolean)).size

        return {
            issues: findMoldOutputIssues(rows),
            rowCount: rows.length,
            productCount,
            totalCavities: sumCavities(rows),
            shotWeightG: computeShotWeightG(rows, parseDecimal(runnerWeight)),
        }
    }, [runnerWeight, watchedOutputs])

    return (
        <div className="space-y-3">
            {fields.length === 0 ? (
                <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                    Bu kalıp henüz bir ölçüye bağlanmadı. Planlamada kullanılabilmesi için en az bir göz grubu ekleyin.
                    Yalnız kendi ürettiğimiz (iç üretim tedarikçisine bağlı) ölçüler listelenir.
                </p>
            ) : (
                <ol className="space-y-3">
                    {fields.map((item, index) => (
                        <MoldOutputRow
                            key={item.id}
                            index={index}
                            productOptions={productOptions}
                            productsLoading={productsQuery.isLoading}
                            onRemove={() => remove(index)}
                        />
                    ))}
                </ol>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl"
                    disabled={fields.length >= MAX_MOLD_OUTPUTS}
                    onClick={() => append(emptyMoldOutputRow())}
                >
                    <Plus className="h-4 w-4" />
                    Göz grubu ekle
                </Button>
                {summary.rowCount > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
                        {summary.rowCount > 1 ? (
                            <Badge variant="secondary" className="rounded-full">
                                Aile kalıbı{summary.productCount > 1 ? ` · ${summary.productCount} ürün modeli` : ""}
                            </Badge>
                        ) : null}
                        <span>
                            {summary.totalCavities} göz ·{" "}
                            {summary.shotWeightG !== null
                                ? `baskı ≈ ${summary.shotWeightG.toLocaleString("tr-TR")} g`
                                : "baskı ağırlığı için parça ağırlıklarını girin"}
                        </span>
                    </div>
                ) : null}
            </div>

            {summary.issues.length > 0 ? (
                <ul className="space-y-1 text-sm text-destructive">
                    {summary.issues.map((issue) => (
                        <li key={issue} className="flex items-start gap-2">
                            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                            {issue}
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    )
}
