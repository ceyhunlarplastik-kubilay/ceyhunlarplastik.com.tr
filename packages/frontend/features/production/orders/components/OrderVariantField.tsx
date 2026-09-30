"use client"

import { useMemo } from "react"
import { useFormContext, useWatch } from "react-hook-form"

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { SearchableSelect } from "@/components/ui/searchable-select"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { ProductionOrderFormInput, ProductionOrderFormValues } from "@/features/production/orders/schema/productionOrderForm"
import type { ReferenceVariantVersion } from "@/features/production/references/api/types"
import {
    useReferenceProducts,
    useReferenceProductVariants,
} from "@/features/production/references/hooks/useProductionReferences"

/** "V1 · Siyah · PP" (ya da `code` verilirse "10.1.3.V1 · Siyah · PP") + renk noktası. */
export function VersionLabel({ version, code }: { version: ReferenceVariantVersion; code?: string }) {
    const parts = [version.colorName, version.materials.join(" + ")].filter(Boolean)
    return (
        <span className="inline-flex min-w-0 items-center gap-1.5">
            {version.colorHex ? (
                <span className="h-3 w-3 shrink-0 rounded-full border" style={{ backgroundColor: version.colorHex }} aria-hidden />
            ) : null}
            <span className="truncate">{[code ?? version.code, ...parts].join(" · ")}</span>
        </span>
    )
}

/**
 * Ürün modeli → varyant. Yalnız ÜRETİLEBİLİR (iç üretim tedarikçisine bağlı + kullanılabilir kalıbı olan) ölçüler gelir;
 * varyantlar ölçüye göre gruplanır, seçilen ölçünün kalıpları altta yazar.
 */
export function OrderVariantField() {
    const form = useFormContext<ProductionOrderFormInput, unknown, ProductionOrderFormValues>()
    const [productId, variantId] = useWatch({ control: form.control, name: ["productId", "productVariantId"] })
    const productsQuery = useReferenceProducts({ moldable: true })
    const variantsQuery = useReferenceProductVariants(productId || null)

    const productOptions = useMemo(
        () => (productsQuery.data ?? []).map((product) => ({
            value: product.id,
            label: `${product.code} · ${product.name}`,
            keywords: product.code,
        })),
        [productsQuery.data],
    )
    const sizes = useMemo(() => variantsQuery.data?.sizes ?? [], [variantsQuery.data])
    const selectedSize = sizes.find((size) => size.variants.some((variant) => variant.id === variantId)) ?? null

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Ürün modeli *</FormLabel>
                        <SearchableSelect
                            value={field.value || null}
                            onValueChange={(value) => {
                                field.onChange(value ?? "")
                                form.setValue("productVariantId", "", { shouldValidate: form.formState.isSubmitted })
                            }}
                            options={productOptions}
                            loading={productsQuery.isLoading}
                            placeholder="Ürün modeli seçin"
                            searchPlaceholder="Kod ya da ad ara"
                            emptyText="İç üretim ve kalıbı olan ürün modeli bulunamadı"
                            allowClear={false}
                            aria-label="Ürün modeli"
                        />
                        <FormDescription className="text-xs">Yalnız kendi ürettiğimiz ve kalıbı olan ölçüsü bulunan modeller listelenir.</FormDescription>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="productVariantId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Varyant (ölçü + renk + hammadde) *</FormLabel>
                        <Select
                            value={field.value || undefined}
                            onValueChange={field.onChange}
                            disabled={!productId || variantsQuery.isLoading}
                        >
                            <FormControl>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={productId ? "Varyant seçin" : "Önce ürün modeli seçin"} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {sizes.map((size) => (
                                    <SelectGroup key={size.id}>
                                        <SelectLabel className="text-xs">{size.sizeCode} · {size.label}</SelectLabel>
                                        {size.variants.length === 0 ? (
                                            <SelectItem value={`__none_${size.id}`} disabled>
                                                Katalogda varyantı yok
                                            </SelectItem>
                                        ) : size.variants.map((variant) => (
                                            <SelectItem key={variant.id} value={variant.id}>
                                                <VersionLabel version={variant.version} code={variant.fullCode} />
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedSize ? (
                            <FormDescription className="text-xs">
                                {selectedSize.sizeCode} ölçüsünü basan kalıplar:{" "}
                                {selectedSize.molds.map((mold) => `${mold.code} (${mold.cavities} göz)`).join(", ")}
                            </FormDescription>
                        ) : null}
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    )
}
