"use client"

import { useQuery } from "@tanstack/react-query"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getProductFilterCategories } from "@/features/workspaceProducts/api/getProductFilterCategories"
import { useCreateSupplierBusinessRequest } from "@/features/supplier/businessRequests/hooks/useCreateSupplierBusinessRequest"

const schema = z.object({
    categoryId: z.string().min(1, "Kategori seçilmelidir"),
    code: z.string().min(1, "Ürün kodu zorunlu"),
    name: z.string().min(2, "Ürün adı zorunlu"),
    description: z.string().max(500).optional(),
})

type Values = z.infer<typeof schema>

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateSupplierProductRequestDialog({ open, onOpenChange }: Props) {
    const mutation = useCreateSupplierBusinessRequest("Ürün talebi onaya gönderildi")
    const categoriesQuery = useQuery({
        queryKey: ["workspace-product-filter-categories"],
        queryFn: getProductFilterCategories,
        staleTime: 1000 * 60 * 10,
    })
    const form = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: {
            categoryId: "",
            code: "",
            name: "",
            description: "",
        },
    })
    const categoryId = useWatch({
        control: form.control,
        name: "categoryId",
    })

    const onSubmit = form.handleSubmit(async (values) => {
        const category = (categoriesQuery.data ?? []).find((item) => item.id === values.categoryId)

        await mutation.mutateAsync({
            type: "SUPPLIER_PRODUCT_CREATE",
            title: `${values.code} · ${values.name}`,
            description: values.description?.trim() || null,
            requestedData: {
                categoryId: values.categoryId,
                categoryName: category?.name ?? "",
                code: values.code.trim(),
                name: values.name.trim(),
                description: values.description?.trim() || "",
                attributeValueIds: [],
            },
        })

        onOpenChange(false)
        form.reset()
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Ürün Oluşturma Talebi</DialogTitle>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Kategori</Label>
                            <Select value={categoryId} onValueChange={(value) => form.setValue("categoryId", value, { shouldValidate: true })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Kategori seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(categoriesQuery.data ?? []).map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.code} · {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.formState.errors.categoryId ? <p className="text-xs text-red-500">{form.formState.errors.categoryId.message}</p> : null}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Ürün Kodu</Label>
                            <Input placeholder="10.11" {...form.register("code")} />
                            {form.formState.errors.code ? <p className="text-xs text-red-500">{form.formState.errors.code.message}</p> : null}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Ürün Adı</Label>
                        <Input placeholder="Bakalit Tutamak 10.11" {...form.register("name")} />
                        {form.formState.errors.name ? <p className="text-xs text-red-500">{form.formState.errors.name.message}</p> : null}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Açıklama</Label>
                        <Textarea rows={5} placeholder="Ürünün kullanım veya teknik bağlamını açıklayın" {...form.register("description")} />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                            Vazgeç
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Gönderiliyor..." : "Talep Aç"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
