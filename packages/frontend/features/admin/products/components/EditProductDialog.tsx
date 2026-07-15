"use client"

import { useMemo } from "react"
import slugify from "slugify"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"

import {
    InputGroup,
    InputGroupAddon,
    InputGroupText,
    InputGroupTextarea,
} from "@/components/ui/input-group"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { useUpdateProduct } from "@/features/admin/products/hooks/useUpdateProduct"
import { useProduct } from "@/features/admin/products/hooks/useProduct"
import { ProductAssetManager } from "@/features/admin/products/components/asset/ProductAssetManager"
import { ProductAttributeSelect } from "@/features/admin/productAttributes/components/ProductAttributeSelect"
import { ProductIndustrialUsageEditor } from "@/features/admin/products/components/ProductIndustrialUsageEditor"
import { productFormSchema, ProductFormValues } from "../schema/productFormSchema"

import type { Product } from "@/features/public/products/types"
import type { Category } from "@/features/public/categories/types"

type Props = {
    product: Product
    open: boolean
    onOpenChange: (open: boolean) => void
    categories: Category[]
    onUpdated: (product: Product) => void
}

const PRODUCT_FILTER_EXCLUDED_ATTRIBUTE_CODES = ["sector", "production_group", "usage_area"]

// P1.8(a): Liste "card" view'a indiği için satır-prop'unda industrialUsages yok.
// Dialog açılınca tam ürünü (attributeValues + industrialUsages + assets) fetch
// eder; form default'ları tam veriyle bir kez kurulsun diye form iç bileşene
// ayrıldı (effect ile form.reset yerine — mount-anı defaultValues).
export function EditProductDialog({
    product,
    open,
    onOpenChange,
    categories,
    onUpdated,
}: Props) {
    const { data: fullProduct, isLoading, isError, refetch } = useProduct(product.id, {
        enabled: open,
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Ürün Düzenle</DialogTitle>
                </DialogHeader>

                {isError ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                        <p className="text-sm text-red-600">Ürün bilgisi yüklenemedi.</p>
                        <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                            Tekrar dene
                        </Button>
                    </div>
                ) : isLoading || !fullProduct ? (
                    <div className="flex items-center justify-center gap-2 py-24 text-sm text-neutral-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Ürün yükleniyor...
                    </div>
                ) : (
                    <EditProductForm
                        product={fullProduct}
                        categories={categories}
                        onUpdated={onUpdated}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}

type EditProductFormProps = {
    product: Product
    categories: Category[]
    onUpdated: (product: Product) => void
}

function EditProductForm({ product, categories, onUpdated }: EditProductFormProps) {
    const updateMutation = useUpdateProduct()

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            name: product.name,
            code: product.code,
            description: product.description ?? "",
            categoryId: product.categoryId,
            attributeValueIds: product.attributeValues
                ?.filter((value) => !PRODUCT_FILTER_EXCLUDED_ATTRIBUTE_CODES.includes(value.attribute?.code ?? ""))
                .map((v) => v.id) ?? [],
            industrialUsages: product.industrialUsages?.map((usage, index) => ({
                sectorValueId: usage.sectorValueId ?? null,
                productionGroupValueId: usage.productionGroupValueId ?? null,
                usageAreaValueId: usage.usageAreaValueId ?? null,
                usageFunction: usage.usageFunction ?? "",
                imageKey: usage.imageKey ?? null,
                imageUrl: usage.imageUrl ?? null,
                displayOrder: usage.displayOrder ?? index,
            })) ?? [],
        },
    })

    const selectedCategoryId = useWatch({ control: form.control, name: "categoryId" })
    const watchedName = useWatch({ control: form.control, name: "name" })
    const selectedCategory = categories.find((category) => category.id === selectedCategoryId)
    const productSlug = useMemo(
        () => slugify(watchedName || product.name, { lower: true, strict: true, locale: "tr" }),
        [watchedName, product.name],
    )

    async function onSubmit(data: ProductFormValues) {
        try {
            const updated = await updateMutation.mutateAsync({
                id: product.id,
                ...data
            })

            toast.success("Ürün güncellendi")
            onUpdated(updated)
        } catch {
            toast.error("Güncelleme başarısız")
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-4">
                            <FieldGroup>
                                <Controller
                                    name="name"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Field>
                                            <FieldLabel>Ürün Adı</FieldLabel>
                                            <Input {...field} />
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="code"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Field>
                                            <FieldLabel>Kod</FieldLabel>
                                            <Input {...field} />
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="categoryId"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel>Kategori</FieldLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Kategori seç" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat.id} value={cat.id}>
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {fieldState.error && <FieldError errors={[fieldState.error]} />}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="description"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Field>
                                            <FieldLabel>Açıklama</FieldLabel>
                                            <InputGroup>
                                                <InputGroupTextarea {...field} rows={4} className="min-h-[120px]" />
                                                <InputGroupAddon align="block-end">
                                                    <InputGroupText>{field.value?.length ?? 0}/500</InputGroupText>
                                                </InputGroupAddon>
                                            </InputGroup>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="attributeValueIds"
                                    control={form.control}
                                    render={({ field }) => (
                                        <ProductAttributeSelect
                                            value={field.value ?? []}
                                            onChange={field.onChange}
                                            allowedAttributeValueIds={selectedCategory?.allowedAttributeValueIds}
                                            singleSelectNonHierarchy
                                            excludeAttributeCodes={PRODUCT_FILTER_EXCLUDED_ATTRIBUTE_CODES}
                                        />
                                    )}
                                />

                                <Button type="submit" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                                </Button>
                            </FieldGroup>
                        </div>

                        <div className="col-span-8">
                            <ProductAssetManager
                                product={product}
                                refetchProduct={async () => location.reload()}
                            />
                        </div>

                        <div className="col-span-12">
                            <Controller
                                name="industrialUsages"
                                control={form.control}
                                render={({ field }) => (
                                    <ProductIndustrialUsageEditor
                                        productSlug={productSlug}
                                        value={field.value ?? []}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                        </div>
                    </div>
        </form>
    )
}
