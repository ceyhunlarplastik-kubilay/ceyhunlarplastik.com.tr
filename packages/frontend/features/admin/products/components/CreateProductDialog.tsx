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

import { useCreateProduct } from "@/features/admin/products/hooks/useCreateProduct"
import { ProductAttributeSelect } from "@/features/admin/productAttributes/components/ProductAttributeSelect"

import { productFormSchema, ProductFormValues } from "../schema/productFormSchema"

import type { Product } from "@/features/public/products/types"
import type { Category } from "@/features/public/categories/types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    categories: Category[]
    onCreated: (product: Product) => void
}

export function CreateProductDialog({
    open,
    onOpenChange,
    categories,
    onCreated
}: Props) {

    const createMutation = useCreateProduct()

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            name: "",
            code: "",
            description: "",
            categoryId: "",
            attributeValueIds: [],
        },
    })

    /*     async function onSubmit(data: ProductFormValues) {
            console.log("FORM DATA:", data) // 👈 EKLE
            const product = await createMutation.mutateAsync(data)
            onCreated(product)
            onOpenChange(false)
            form.reset()
        } */
    async function onSubmit(data: ProductFormValues) {
        try {
            const product = await createMutation.mutateAsync(data)

            toast.success("Ürün başarıyla oluşturuldu")

            onCreated(product)
            onOpenChange(false)
            form.reset()

        } catch (err: any) {
            toast.error("Ürün oluşturulamadı")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Yeni Ürün</DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <FieldGroup>

                        {/* NAME */}
                        <Controller
                            name="name"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Ürün Adı</FieldLabel>
                                    <Input {...field} />
                                    {fieldState.error && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        {/* CODE */}
                        <Controller
                            name="code"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Ürün Kodu</FieldLabel>
                                    <Input {...field} />
                                    {fieldState.error && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        {/* DESCRIPTION */}
                        <Controller
                            name="description"
                            control={form.control}
                            render={({ field }) => (
                                <Field>
                                    <FieldLabel>Açıklama</FieldLabel>

                                    <InputGroup>
                                        <InputGroupTextarea
                                            {...field}
                                            rows={4}
                                            className="min-h-[100px]"
                                        />
                                        <InputGroupAddon align="block-end">
                                            <InputGroupText>
                                                {field.value?.length ?? 0}/500
                                            </InputGroupText>
                                        </InputGroupAddon>
                                    </InputGroup>
                                </Field>
                            )}
                        />

                        {/* CATEGORY */}
                        <Controller
                            name="categoryId"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Kategori</FieldLabel>

                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Kategori seç" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {fieldState.error && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        {/* ATTRIBUTES */}
                        <Controller
                            name="attributeValueIds"
                            control={form.control}
                            render={({ field }) => (
                                <ProductAttributeSelect
                                    value={field.value ?? []}
                                    onChange={field.onChange}
                                />
                            )}
                        />

                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
                        </Button>

                    </FieldGroup>
                </form>
            </DialogContent>
        </Dialog>
    )
}