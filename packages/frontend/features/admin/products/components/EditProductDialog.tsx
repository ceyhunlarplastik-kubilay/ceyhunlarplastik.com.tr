"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

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
import { ProductAssetManager } from "@/features/admin/products/components/asset/ProductAssetManager"
import { ProductAttributeSelect } from "@/features/admin/productAttributes/components/ProductAttributeSelect"
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

export function EditProductDialog({
    product,
    open,
    onOpenChange,
    categories,
    onUpdated
}: Props) {
    const updateMutation = useUpdateProduct()

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            name: product.name,
            code: product.code,
            description: product.description ?? "",
            categoryId: product.categoryId,
            attributeValueIds: product.attributeValues?.map((v) => v.id) ?? [],
        },
    })

    const selectedCategoryId = form.watch("categoryId")
    const selectedCategory = categories.find((category) => category.id === selectedCategoryId)

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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Ürün Düzenle</DialogTitle>
                </DialogHeader>

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
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

